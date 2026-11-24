import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  Inject,
  NotFoundException,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { createHash, randomBytes, randomUUID, timingSafeEqual } from 'node:crypto';
import { mkdir, rename } from 'node:fs/promises';
import { readdir, stat } from 'node:fs/promises';
import { resolve } from 'node:path';
import type { Readable } from 'node:stream';
import { MediaProcessingStatus, MediaType, VerificationSessionStatus } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { getMediaSettings } from './media-settings.js';
import { MediaProcessorService } from './media-processor.service.js';
import { MediaStorageService } from './media-storage.service.js';
import { VERIFICATION_ANALYSIS_PROVIDER } from './verification-analysis.provider.js';
import type { VerificationAnalysisProvider } from './verification-analysis.provider.js';
import { DiscoveryPrivacyService } from '../discovery/discovery-privacy.service.js';

const DELETION_GRACE_MS = 7 * 24 * 60 * 60 * 1000;
const CHALLENGE_ACTIONS = [
  'Turn your head gently to the left, then return to center.',
  'Turn your head gently to the right, then return to center.',
  'Raise one hand briefly, then lower it.',
  'Say the words shown in your recording prompt.',
];

@Injectable()
export class MediaService {
  private readonly settings = getMediaSettings();

  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: MediaStorageService,
    private readonly processor: MediaProcessorService,
    @Inject(VERIFICATION_ANALYSIS_PROVIDER) private readonly verificationAnalyzer: VerificationAnalysisProvider,
    private readonly discoveryPrivacy: DiscoveryPrivacyService,
  ) {}

  async createVerificationSession(userId: string) {
    await this.assertActiveUser(userId);
    const actions = shuffle([...CHALLENGE_ACTIONS]).slice(0, 2);
    const challengeToken = randomBytes(32).toString('base64url');
    const expiresAt = new Date(Date.now() + this.settings.verificationSessionTtlMs);
    const session = await this.prisma.verificationSession.create({
      data: {
        userId,
        challengeTokenHash: sha256String(challengeToken),
        challengeInstructions: { actions, notice: 'These prompts deter simple replay; they do not prove identity.' },
        expiresAt,
      },
      select: { id: true, challengeInstructions: true, expiresAt: true },
    });
    return { ...session, challengeToken };
  }

  async reserveUpload(userId: string, input: {
    mediaType: MediaType;
    contentLength: number;
    verificationSessionId?: string;
    challengeToken?: string;
  }) {
    await this.assertActiveUser(userId);
    if (!Number.isSafeInteger(input.contentLength) || input.contentLength < 1 || input.contentLength > this.settings.maxUploadBytes) {
      throw new BadRequestException('Upload size is outside the configured limit.');
    }
    const isInterview = input.mediaType === MediaType.AGE_INTERVIEW_VIDEO;
    if (isInterview !== Boolean(input.verificationSessionId && input.challengeToken)) {
      throw new BadRequestException('Interview uploads require a valid verification session.');
    }
    const reservedBytes = BigInt(input.contentLength) * 2n + 1_048_576n;
    // Reclaim expired attempts before the quota check so retries do not depend on
    // the periodic worker having run first.
    await this.cleanupExpiredUploadsForUser(userId);
    const reservationId = randomUUID();
    const assetId = randomUUID();
    const keyPrefix = isInterview ? 'videos' : 'photos';
    const extension = isInterview ? 'mp4' : 'webp';
    const storageKey = `${keyPrefix}/${userId}/${randomUUID()}.${extension}`;
    const expiresAt = new Date(Date.now() + this.settings.reservationTtlMs);

    await this.prisma.$transaction(async (tx) => {
      // Serialize reservations per owner so simultaneous requests cannot bypass the
      // one-pending-submission rule.
      await tx.$queryRaw`SELECT "id" FROM "User" WHERE "id" = ${userId}::uuid FOR UPDATE`;
      const account = await tx.user.findUnique({ where: { id: userId }, select: { accountStatus: true } });
      if (!account || account.accountStatus !== 'ACTIVE') throw new ForbiddenException('Account is unavailable for uploads.');
      if (isInterview) {
        const pending = await tx.humanVerification.findFirst({
          where: { userId, status: { in: ['PENDING', 'MANUAL_REVIEW'] } }, select: { id: true },
        });
        const activeReservation = await tx.mediaStorageReservation.findFirst({
          where: { userId, mediaType: MediaType.AGE_INTERVIEW_VIDEO, status: { in: ['ACTIVE', 'RECEIVING'] }, expiresAt: { gt: new Date() } }, select: { id: true },
        });
        if (pending || activeReservation) throw new ConflictException('A video verification submission is already being reviewed.');
        const session = await tx.verificationSession.findFirst({
          where: { id: input.verificationSessionId, userId, status: 'OPEN', expiresAt: { gt: new Date() } },
          select: { id: true, challengeTokenHash: true },
        });
        if (!session || !constantTimeEqual(session.challengeTokenHash, sha256String(input.challengeToken!))) {
          throw new BadRequestException('Verification session is invalid or expired.');
        }
      }

      const quotaUpdated = await tx.$executeRaw`
        UPDATE "MediaStorageQuota"
        SET "maxBytes" = ${this.settings.quotaBytes},
            "reservedBytes" = "reservedBytes" + ${reservedBytes}
        WHERE "id" = 1 AND "usedBytes" + "reservedBytes" + ${reservedBytes} <= ${this.settings.quotaBytes}
      `;
      if (quotaUpdated !== 1) throw new ConflictException('Media storage capacity is unavailable.');

      await tx.mediaStorageReservation.create({
        data: { id: reservationId, userId, mediaType: input.mediaType, reservedBytes, expiresAt },
      });
      await tx.mediaAsset.create({
        data: {
          id: assetId,
          userId,
          type: input.mediaType,
          processingStatus: MediaProcessingStatus.UPLOADING,
          storageKey,
          originalSizeBytes: BigInt(input.contentLength),
          mimeType: 'application/octet-stream',
          reservationId,
        },
      });

      if (isInterview) {
        const consumed = await tx.verificationSession.updateMany({
          where: { id: input.verificationSessionId, userId, status: VerificationSessionStatus.OPEN, expiresAt: { gt: new Date() } },
          data: { status: VerificationSessionStatus.CONSUMED, consumedAt: new Date(), mediaAssetId: assetId },
        });
        if (consumed.count !== 1) throw new BadRequestException('Verification session has already been used.');
      }
    });

    return { reservationId, assetId, expiresAt, uploadPath: `/media/storage-reservations/${reservationId}/content` };
  }

  async receiveUpload(userId: string, reservationId: string, contentLength: number | undefined, input: Readable) {
    const now = new Date();
    const reservation = await this.prisma.$transaction(async (tx) => {
      const current = await tx.mediaStorageReservation.findFirst({
        where: { id: reservationId, userId, status: 'ACTIVE', expiresAt: { gt: now } },
        include: { mediaAsset: true },
      });
      if (!current?.mediaAsset) return null;
      const claim = await tx.mediaStorageReservation.updateMany({
        where: { id: reservationId, userId, status: 'ACTIVE', expiresAt: { gt: now } },
        data: { status: 'RECEIVING', expiresAt: new Date(now.getTime() + this.settings.reservationTtlMs) },
      });
      return claim.count === 1 ? current : null;
    });
    if (!reservation?.mediaAsset) {
      await this.releaseIncompleteReservation(reservationId, now, true, userId);
      throw new NotFoundException('Upload reservation was not found.');
    }
    if (!contentLength || BigInt(contentLength) !== reservation.mediaAsset.originalSizeBytes) {
      await this.failUpload(reservation.id, reservation.mediaAsset.id);
      throw new BadRequestException('Content-Length does not match the reserved upload size.');
    }

    const sourcePath = this.storage.quarantinePath(reservationId);
    try {
      const receivedBytes = await this.storage.writeUpload(reservationId, input, Number(reservation.mediaAsset.originalSizeBytes));
      if (receivedBytes !== Number(reservation.mediaAsset.originalSizeBytes)) throw new BadRequestException('Uploaded size did not match reservation.');
      const slot = await this.acquireProcessingSlot(reservation.mediaAsset.id);
      if (!slot) throw new ServiceUnavailableException('Media processing is busy; retry with a new upload session.');

      try {
        return await this.processAndCommit(reservation, sourcePath, receivedBytes);
      } finally {
        await this.releaseProcessingSlot(reservation.mediaAsset.id);
      }
    } catch (error) {
      await this.failUpload(reservation.id, reservation.mediaAsset.id);
      throw error;
    }
  }

  async getPrivateMedia(userId: string, assetId: string) {
    const asset = await this.prisma.mediaAsset.findUnique({ where: { id: assetId } });
    if (!asset || asset.processingStatus !== MediaProcessingStatus.READY) throw new NotFoundException('Media was not found.');
    const isOwner = asset.userId === userId;
    const isReviewer = asset.type === MediaType.AGE_INTERVIEW_VIDEO && this.isReviewer(userId);
    if (!isOwner && !isReviewer) throw new ForbiddenException('You cannot access this media.');
    return {
      path: this.storage.permanentPath(asset.type, asset.storageKey),
      mimeType: asset.mimeType,
      size: Number(asset.storedSizeBytes ?? 0),
    };
  }

  async getDiscoveryProfilePhoto(viewerId: string, ownerId: string, assetId: string) {
    if (!await this.discoveryPrivacy.canAccessProfile(viewerId, ownerId)) throw new NotFoundException('Media was not found.');
    const asset = await this.prisma.mediaAsset.findFirst({
      where: { id: assetId, userId: ownerId, type: MediaType.PROFILE_PHOTO, processingStatus: MediaProcessingStatus.READY,
        profilePhoto: { is: { userId: ownerId } } },
    });
    if (!asset) throw new NotFoundException('Media was not found.');
    return { path: this.storage.permanentPath(asset.type, asset.storageKey), mimeType: asset.mimeType, size: Number(asset.storedSizeBytes ?? 0) };
  }

  async removeOwnMedia(userId: string, assetId: string): Promise<void> {
    const asset = await this.prisma.mediaAsset.findFirst({ where: { id: assetId, userId } });
    if (!asset) throw new NotFoundException('Media was not found.');
    if (asset.type === MediaType.AGE_INTERVIEW_VIDEO) {
      throw new ConflictException('Verification videos are retained until account deletion.');
    }
    if (asset.processingStatus !== MediaProcessingStatus.READY && asset.processingStatus !== MediaProcessingStatus.FAILED) {
      throw new ConflictException('Media is currently being processed.');
    }
    await this.storage.remove(this.storage.permanentPath(asset.type, asset.storageKey));
    if (asset.thumbnailStorageKey) await this.storage.remove(this.storage.permanentPath(asset.type, asset.thumbnailStorageKey));
    await this.prisma.$transaction(async (tx) => {
      await tx.verificationSession.updateMany({ where: { mediaAssetId: asset.id }, data: { mediaAssetId: null } });
      await tx.humanVerification.updateMany({ where: { mediaAssetId: asset.id }, data: { mediaAssetId: null, mediaAssetType: null, mediaProcessingStatus: null } });
      await tx.mediaAsset.delete({ where: { id: asset.id } });
      if (asset.storedSizeBytes) {
        await tx.mediaStorageQuota.update({ where: { id: 1 }, data: { usedBytes: { decrement: asset.storedSizeBytes } } });
      }
    });
  }

  async getVerificationStatus(userId: string) {
    return this.prisma.humanVerification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: { id: true, status: true, createdAt: true, reviewedAt: true, decisionReason: true },
    });
  }

  async pendingReviews(userId: string) {
    this.assertReviewer(userId);
    return this.prisma.humanVerification.findMany({
      where: { userId: { not: userId }, status: { in: ['PENDING', 'MANUAL_REVIEW'] }, mediaAsset: { processingStatus: 'READY', type: 'AGE_INTERVIEW_VIDEO' } },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true, status: true, createdAt: true, owner: { select: { id: true, fullName: true } },
        mediaAsset: { select: { id: true, durationSeconds: true, storedSizeBytes: true, mimeType: true } },
        session: { select: { challengeInstructions: true } },
      },
    });
  }

  async decideVerification(userId: string, verificationId: string, status: 'VERIFIED' | 'FAILED', reason?: string) {
    this.assertReviewer(userId);
    if (status === 'FAILED' && !reason?.trim()) throw new BadRequestException('A reason is required when rejecting a video.');
    const result = await this.prisma.humanVerification.updateMany({
      where: { id: verificationId, userId: { not: userId }, status: { in: ['PENDING', 'MANUAL_REVIEW'] }, mediaAsset: { type: 'AGE_INTERVIEW_VIDEO', processingStatus: 'READY' } },
      data: { status, reviewerUserId: userId, reviewedAt: new Date(), decisionReason: reason?.trim() || null },
    });
    if (result.count !== 1) throw new NotFoundException('Review item was not found or has already been decided.');
    return this.prisma.humanVerification.findUnique({
      where: { id: verificationId }, select: { id: true, status: true, reviewerUserId: true, reviewedAt: true, decisionReason: true },
    });
  }

  async requestAccountDeletion(userId: string) {
    const existing = await this.prisma.user.findUnique({ where: { id: userId }, select: { accountStatus: true, deletionRequestedAt: true, deletionScheduledAt: true } });
    if (!existing) throw new NotFoundException('Account was not found.');
    if (existing.accountStatus === 'PENDING_DELETION') {
      return { status: existing.accountStatus, requestedAt: existing.deletionRequestedAt, scheduledAt: existing.deletionScheduledAt };
    }
    const now = new Date();
    const scheduledAt = new Date(now.getTime() + DELETION_GRACE_MS);
    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({ where: { id: userId }, data: { accountStatus: 'PENDING_DELETION', deletionRequestedAt: now, deletionScheduledAt: scheduledAt } });
      await tx.mediaDeletionJob.upsert({
        where: { userId },
        create: { userId, nextAttemptAt: scheduledAt },
        update: { nextAttemptAt: scheduledAt },
      });
    });
    return { status: 'PENDING_DELETION', requestedAt: now, scheduledAt };
  }

  private async processAndCommit(reservation: {
    id: string; userId: string; mediaType: MediaType; reservedBytes: bigint;
    mediaAsset: { id: string; storageKey: string; originalSizeBytes: bigint; reservationId: string | null } | null;
  }, sourcePath: string, receivedBytes: number) {
    const asset = reservation.mediaAsset!;
    const suffix = reservation.mediaType === MediaType.PROFILE_PHOTO ? '.webp' : '.mp4';
    const outputPath = this.storage.temporaryPath(asset.id, suffix);
    const thumbnailPath = this.storage.temporaryPath(asset.id, '.thumb.webp');
    const finalThumbKey = asset.storageKey.replace(/\.(webp|mp4)$/, '.thumb.webp');
    const finalPath = this.storage.permanentPath(reservation.mediaType, asset.storageKey);
    const finalThumbPath = this.storage.permanentPath(reservation.mediaType, finalThumbKey);
    try {
      const processed = await this.processor.process(
        reservation.mediaType,
        sourcePath,
        outputPath,
        thumbnailPath,
      );
      await Promise.all([this.storage.restrictFile(outputPath), this.storage.restrictFile(thumbnailPath)]);
      const processedSize = await this.storage.fileSize(outputPath);
      const thumbSize = await this.storage.fileSize(thumbnailPath);
      const totalSize = BigInt(processedSize + thumbSize);
      const peakTemporaryBytes = asset.originalSizeBytes + totalSize;
      if (peakTemporaryBytes > reservation.reservedBytes) throw new ConflictException('Processing exceeded its capacity reservation.');
      await mkdir(resolve(finalPath, '..'), { recursive: true, mode: 0o750 });
      await rename(outputPath, finalPath);
      await rename(thumbnailPath, finalThumbPath);
      // Originals are removed only after the processed file and thumbnail were verified and moved.
      await this.storage.remove(sourcePath);

      const analysis = reservation.mediaType === MediaType.AGE_INTERVIEW_VIDEO
        ? await this.verificationAnalyzer.analyze({ contentSha256: processed.contentSha256 })
        : null;
      await this.prisma.$transaction(async (tx) => {
        const currentOwner = await tx.user.findUnique({ where: { id: reservation.userId }, select: { accountStatus: true } });
        if (!currentOwner || currentOwner.accountStatus !== 'ACTIVE') throw new ForbiddenException('Account is unavailable for media processing.');
        const activeReservation = await tx.mediaStorageReservation.updateMany({
          where: { id: reservation.id, status: 'RECEIVING', expiresAt: { gt: new Date() } },
          data: { status: 'COMMITTED' },
        });
        if (activeReservation.count !== 1) throw new ConflictException('Upload reservation expired during processing.');
        await tx.mediaStorageQuota.update({
          where: { id: 1 },
          data: { reservedBytes: { decrement: reservation.reservedBytes }, usedBytes: { increment: totalSize } },
        });
        await tx.mediaAsset.update({
          where: { id: asset.id },
          data: {
            processingStatus: MediaProcessingStatus.READY,
            processingSlotAcquired: false,
            storageKey: asset.storageKey,
            thumbnailStorageKey: finalThumbKey,
            storedSizeBytes: totalSize,
            mimeType: processed.mimeType,
            format: processed.format,
            width: processed.width,
            height: processed.height,
            durationSeconds: processed.durationSeconds,
          },
        });
        await tx.$executeRaw`
          UPDATE "MediaStorageQuota" SET "activeProcessingJobs" = GREATEST("activeProcessingJobs" - 1, 0)
          WHERE "id" = 1
        `;
        if (reservation.mediaType === MediaType.AGE_INTERVIEW_VIDEO) {
          const session = await tx.verificationSession.findFirst({ where: { mediaAssetId: asset.id, userId: reservation.userId }, select: { id: true } });
          if (!session) throw new Error('Consumed verification session missing.');
          await tx.humanVerification.create({
            data: {
              userId: reservation.userId,
              mediaAssetId: asset.id,
              mediaAssetType: MediaType.AGE_INTERVIEW_VIDEO,
              mediaProcessingStatus: MediaProcessingStatus.READY,
              sessionId: session.id,
              status: analysis!.initialStatus,
              provider: analysis!.provider,
              contentSha256: processed.contentSha256,
              checks: { ...analysis!.checks, mediaIntegrityPassed: processed.integrityPassed },
            },
          });
        }
      });
      return {
        assetId: asset.id,
        mediaType: reservation.mediaType,
        processingStatus: 'READY',
        verificationStatus: analysis?.initialStatus,
      };
    } catch (error) {
      // A database commit may have succeeded even if its acknowledgement failed.
      // Preserve permanent video paths whenever submitted state exists or cannot
      // be checked; account deletion is the only submitted-video cleanup path.
      if (await this.canRemoveUnsubmittedFiles(reservation.id, asset.id)) {
        await this.storage.remove(finalPath).catch(() => undefined);
        await this.storage.remove(finalThumbPath).catch(() => undefined);
      }
      await this.storage.remove(outputPath).catch(() => undefined);
      await this.storage.remove(thumbnailPath).catch(() => undefined);
      throw error;
    }
  }

  private async canRemoveUnsubmittedFiles(reservationId: string, assetId: string): Promise<boolean> {
    try {
      const [reservation, verification] = await Promise.all([
        this.prisma.mediaStorageReservation.findUnique({ where: { id: reservationId }, select: { status: true } }),
        this.prisma.humanVerification.findFirst({ where: { mediaAssetId: assetId }, select: { id: true } }),
      ]);
      return reservation?.status !== 'COMMITTED' && !verification;
    } catch {
      return false;
    }
  }

  private async failUpload(reservationId: string, assetId: string): Promise<void> {
    await this.releaseIncompleteReservation(reservationId, new Date(), false, undefined, assetId);
  }

  private async cleanupExpiredUploadsForUser(userId: string, now = new Date()): Promise<number> {
    const expired = await this.prisma.mediaStorageReservation.findMany({
      where: { userId, status: { in: ['ACTIVE', 'RECEIVING'] }, expiresAt: { lte: now } },
      select: { id: true },
    });
    let cleaned = 0;
    for (const { id } of expired) {
      if (await this.releaseIncompleteReservation(id, now, true, userId)) cleaned += 1;
    }
    return cleaned;
  }

  /**
   * Release one incomplete upload while holding its reservation row lock. The
   * conditional state transition is the idempotency gate for quota accounting;
   * files are limited to paths derived from this reservation and its asset.
   */
  private async releaseIncompleteReservation(
    reservationId: string,
    now: Date,
    expiredOnly: boolean,
    userId?: string,
    expectedAssetId?: string,
  ): Promise<boolean> {
    return this.prisma.$transaction(async (tx) => {
      const rows = await tx.$queryRaw<Array<{
        id: string; userId: string; mediaType: MediaType; status: string;
        reservedBytes: bigint; expiresAt: Date;
      }>>`
        SELECT "id", "userId", "mediaType", "status", "reservedBytes", "expiresAt"
        FROM "MediaStorageReservation"
        WHERE "id" = ${reservationId}
          AND (${userId ?? null}::uuid IS NULL OR "userId" = ${userId ?? null}::uuid)
        FOR UPDATE
      `;
      const reservation = rows[0];
      if (!reservation || !['ACTIVE', 'RECEIVING'].includes(reservation.status)) return false;
      if (expiredOnly && reservation.expiresAt > now) return false;

      const asset = await tx.mediaAsset.findFirst({ where: { reservationId } });
      if (expectedAssetId && asset?.id !== expectedAssetId) return false;
      if (asset && !['UPLOADING', 'PROCESSING', 'FAILED'].includes(asset.processingStatus)) return false;

      if (asset) {
        const verification = await tx.humanVerification.findFirst({
          where: { userId: reservation.userId, mediaAssetId: asset.id }, select: { id: true },
        });
        // Submitted records and their files are retained regardless of review status.
        if (verification) return false;
      }

      await this.removeIncompleteUploadFiles(reservationId, asset);

      const released = await tx.mediaStorageReservation.updateMany({
        where: {
          id: reservationId,
          status: { in: ['ACTIVE', 'RECEIVING'] },
          ...(expiredOnly ? { expiresAt: { lte: now } } : {}),
        },
        data: { status: 'RELEASED' },
      });
      if (released.count !== 1) return false;

      const quota = await tx.mediaStorageQuota.updateMany({
        where: { id: 1, reservedBytes: { gte: reservation.reservedBytes } },
        data: { reservedBytes: { decrement: reservation.reservedBytes } },
      });
      if (quota.count !== 1) throw new Error('Reserved media quota could not be reconciled safely.');

      if (asset) {
        const failed = await tx.mediaAsset.updateMany({
          where: { id: asset.id, reservationId, processingStatus: { in: ['UPLOADING', 'PROCESSING', 'FAILED'] } },
          data: { processingStatus: 'FAILED', processingSlotAcquired: false },
        });
        if (failed.count && asset.processingSlotAcquired) {
          await tx.$executeRaw`
            UPDATE "MediaStorageQuota" SET "activeProcessingJobs" = GREATEST("activeProcessingJobs" - 1, 0)
            WHERE "id" = 1
          `;
        }
      }
      return true;
    });
  }

  private async removeIncompleteUploadFiles(
    reservationId: string,
    asset: { id: string; type: MediaType; storageKey: string; thumbnailStorageKey: string | null } | null,
  ): Promise<void> {
    await this.storage.remove(this.storage.quarantinePath(reservationId));
    if (!asset) return;
    await Promise.all([
      this.storage.remove(this.storage.temporaryPath(asset.id, '.mp4')),
      this.storage.remove(this.storage.temporaryPath(asset.id, '.webp')),
      this.storage.remove(this.storage.temporaryPath(asset.id, '.thumb.webp')),
      this.storage.remove(this.storage.permanentPath(asset.type, asset.storageKey)),
      ...(asset.thumbnailStorageKey
        ? [this.storage.remove(this.storage.permanentPath(asset.type, asset.thumbnailStorageKey))]
        : []),
    ]);
  }

  private async acquireProcessingSlot(assetId: string): Promise<boolean> {
    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.$executeRaw`
        UPDATE "MediaStorageQuota"
        SET "activeProcessingJobs" = "activeProcessingJobs" + 1,
            "maxConcurrentProcessingJobs" = ${this.settings.maxConcurrentJobs}
        WHERE "id" = 1 AND "activeProcessingJobs" < ${this.settings.maxConcurrentJobs}
      `;
      if (updated !== 1) return false;
      await tx.mediaAsset.update({ where: { id: assetId }, data: { processingStatus: 'PROCESSING', processingSlotAcquired: true } });
      return true;
    });
  }

  private async releaseProcessingSlot(assetId: string): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const released = await tx.mediaAsset.updateMany({
        where: { id: assetId, processingSlotAcquired: true },
        data: { processingSlotAcquired: false },
      });
      if (released.count) {
        await tx.$executeRaw`
          UPDATE "MediaStorageQuota" SET "activeProcessingJobs" = GREATEST("activeProcessingJobs" - 1, 0)
          WHERE "id" = 1
        `;
      }
    });
  }

  async processDueDeletionJobs(now = new Date()): Promise<number> {
    const due = await this.prisma.mediaDeletionJob.findMany({
      where: {
        OR: [
          { status: { in: ['PENDING', 'RETRY'] }, nextAttemptAt: { lte: now } },
          { status: 'PROCESSING', leaseExpiresAt: { lte: now } },
        ],
      },
      orderBy: { nextAttemptAt: 'asc' },
      take: 5,
      select: { id: true, userId: true, attempts: true },
    });
    let completed = 0;
    for (const job of due) {
      const claimed = await this.prisma.mediaDeletionJob.updateMany({
        where: {
          id: job.id,
          OR: [
            { status: { in: ['PENDING', 'RETRY'] }, nextAttemptAt: { lte: now } },
            { status: 'PROCESSING', leaseExpiresAt: { lte: now } },
          ],
        },
        data: { status: 'PROCESSING', attempts: { increment: 1 }, leaseExpiresAt: new Date(now.getTime() + 24 * 60 * 60 * 1000) },
      });
      if (claimed.count !== 1) continue;

      try {
        const [assets, reservations] = await Promise.all([
          this.prisma.mediaAsset.findMany({ where: { userId: job.userId }, select: { id: true, type: true, storageKey: true, thumbnailStorageKey: true, storedSizeBytes: true, processingSlotAcquired: true } }),
          this.prisma.mediaStorageReservation.findMany({ where: { userId: job.userId, status: { in: ['ACTIVE', 'RECEIVING'] } }, select: { id: true, reservedBytes: true } }),
        ]);
        await Promise.all(assets.flatMap((asset) => [
          this.storage.remove(this.storage.permanentPath(asset.type, asset.storageKey)),
          asset.thumbnailStorageKey ? this.storage.remove(this.storage.permanentPath(asset.type, asset.thumbnailStorageKey)) : Promise.resolve(),
          this.storage.remove(this.storage.temporaryPath(asset.id, '.mp4')),
          this.storage.remove(this.storage.temporaryPath(asset.id, '.webp')),
          this.storage.remove(this.storage.temporaryPath(asset.id, '.thumb.webp')),
        ]));
        await Promise.all(reservations.map((reservation) => this.storage.remove(this.storage.quarantinePath(reservation.id))));

        const used = assets.reduce((sum, asset) => sum + (asset.storedSizeBytes ?? 0n), 0n);
        const reserved = reservations.reduce((sum, reservation) => sum + reservation.reservedBytes, 0n);
        await this.prisma.$transaction(async (tx) => {
          const assetIds = assets.map((asset) => asset.id);
          if (assetIds.length) {
            await tx.verificationSession.updateMany({ where: { mediaAssetId: { in: assetIds } }, data: { mediaAssetId: null } });
            await tx.humanVerification.updateMany({ where: { mediaAssetId: { in: assetIds } }, data: { mediaAssetId: null, mediaAssetType: null, mediaProcessingStatus: null } });
          }
          await tx.mediaAsset.deleteMany({ where: { userId: job.userId } });
          await tx.mediaStorageReservation.deleteMany({ where: { userId: job.userId } });
          await tx.mediaStorageQuota.update({
            where: { id: 1 },
            data: {
              usedBytes: { decrement: used },
              ...(reserved > 0n ? { reservedBytes: { decrement: reserved } } : {}),
            },
          });
          const slots = assets.filter((asset) => asset.processingSlotAcquired).length;
          if (slots) {
            await tx.$executeRaw`
              UPDATE "MediaStorageQuota" SET "activeProcessingJobs" = GREATEST("activeProcessingJobs" - ${slots}, 0)
              WHERE "id" = 1
            `;
          }
          await tx.mediaDeletionJob.update({
            where: { id: job.id },
            data: { status: 'COMPLETED', completedAt: new Date(), leaseExpiresAt: null, lastErrorCode: null },
          });
        });
        completed += 1;
      } catch {
        await this.prisma.mediaDeletionJob.update({
          where: { id: job.id },
          data: {
            status: 'RETRY',
            leaseExpiresAt: null,
            lastErrorCode: 'MEDIA_CLEANUP_RETRY',
            nextAttemptAt: new Date(now.getTime() + retryDelayMs(job.attempts + 1)),
          },
        }).catch(() => undefined);
      }
    }
    return completed;
  }

  async cleanupStaleUploads(now = new Date()): Promise<number> {
    const stale = await this.prisma.mediaStorageReservation.findMany({
      where: {
        status: { in: ['ACTIVE', 'RECEIVING'] },
        expiresAt: { lte: now },
      },
      take: 100,
      select: { id: true },
    });
    let cleaned = 0;
    for (const { id } of stale) if (await this.releaseIncompleteReservation(id, now, true)) cleaned += 1;
    return cleaned;
  }

  async scanStorageUsage(): Promise<void> {
    const root = this.settings.root;
    let actualBytes = 0n;
    const pending = [root];
    while (pending.length) {
      const directory = pending.pop()!;
      let entries;
      try {
        entries = await readdir(directory, { withFileTypes: true });
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') continue;
        throw error;
      }
      for (const entry of entries) {
        const path = resolve(directory, entry.name);
        if (entry.isSymbolicLink()) continue;
        if (entry.isDirectory()) pending.push(path);
        else if (entry.isFile()) actualBytes += BigInt((await stat(path)).size);
      }
    }
    const quota = await this.prisma.mediaStorageQuota.findUnique({ where: { id: 1 } });
    const capacity = this.settings.quotaBytes;
    const usagePercent = Number((actualBytes * 10_000n) / capacity) / 100;
    const logger = new Logger(MediaService.name);
    logger.log(`Media disk scan: ${actualBytes} of ${capacity} bytes (${usagePercent.toFixed(2)}%).`);
    if (actualBytes * 100n >= capacity * 80n) logger.warn(`Media disk usage is approaching capacity (${usagePercent.toFixed(2)}%).`);
    if (quota && quota.usedBytes + quota.reservedBytes !== actualBytes) {
      logger.warn(`Media disk/counter discrepancy: disk=${actualBytes}, counters=${quota.usedBytes + quota.reservedBytes}. No files were removed.`);
    }
  }

  private async assertActiveUser(userId: string): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { accountStatus: true } });
    if (!user) throw new UnauthorizedException('Account is unavailable.');
    if (user.accountStatus !== 'ACTIVE') throw new ForbiddenException('Account deletion is pending.');
  }

  private isReviewer(userId: string): boolean {
    const reviewerId = process.env.CHOCOLATE_REVIEWER_USER_ID?.trim().toLowerCase();
    return Boolean(reviewerId && reviewerId === userId.toLowerCase());
  }

  hasReviewerAccess(userId: string): boolean {
    return this.isReviewer(userId);
  }

  private assertReviewer(userId: string): void {
    if (!process.env.CHOCOLATE_REVIEWER_USER_ID?.trim()) throw new ServiceUnavailableException('Reviewer access is not configured.');
    if (!this.isReviewer(userId)) throw new ForbiddenException('Reviewer access is required.');
  }
}

function sha256String(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

function constantTimeEqual(left: string, right: string): boolean {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

function shuffle<T>(items: T[]): T[] {
  for (let i = items.length - 1; i > 0; i -= 1) {
    const j = randomBytes(4).readUInt32BE(0) % (i + 1);
    [items[i], items[j]] = [items[j], items[i]];
  }
  return items;
}

function retryDelayMs(attempt: number): number {
  return Math.min(60_000 * 2 ** Math.max(0, attempt - 1), 24 * 60 * 60 * 1000);
}
