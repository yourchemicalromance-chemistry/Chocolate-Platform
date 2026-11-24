import { BadRequestException, ConflictException, ForbiddenException } from '@nestjs/common';
import { MediaService } from './media.service.js';
import { MediaType } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { MediaStorageService } from './media-storage.service.js';
import { MediaProcessorService } from './media-processor.service.js';
import { DiscoveryPrivacyService } from '../discovery/discovery-privacy.service.js';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { Readable } from 'node:stream';

describe('MediaService access and quota controls', () => {
  let service: MediaService;
  let prisma: any;
  let storage: any;
  let processor: any;
  let analyzer: any;

  beforeEach(() => {
    delete process.env.CHOCOLATE_REVIEWER_USER_ID;
    prisma = {
      user: { findUnique: vi.fn().mockResolvedValue({ accountStatus: 'ACTIVE' }) },
      mediaAsset: { findUnique: vi.fn(), findFirst: vi.fn() },
      mediaStorageReservation: { findMany: vi.fn().mockResolvedValue([]) },
      humanVerification: { findFirst: vi.fn() },
      mediaStorageQuota: { findUnique: vi.fn().mockResolvedValue({ usedBytes: 0n, reservedBytes: 0n }) },
      $transaction: vi.fn((fn) => fn({
        $queryRaw: vi.fn().mockResolvedValue([]),
        $executeRaw: vi.fn().mockResolvedValue(0),
        user: { findUnique: vi.fn().mockResolvedValue({ accountStatus: 'ACTIVE' }) },
        mediaDeletionJob: { upsert: vi.fn() },
        mediaStorageQuota: { findUnique: vi.fn().mockResolvedValue({ usedBytes: 0n, reservedBytes: 0n }) },
        verificationSession: { findFirst: vi.fn() },
        humanVerification: { findFirst: vi.fn().mockResolvedValue(null) },
        mediaStorageReservation: { findFirst: vi.fn().mockResolvedValue(null), create: vi.fn() },
        mediaAsset: { create: vi.fn() },
      })),
      $executeRaw: vi.fn(),
    };
    storage = { permanentPath: vi.fn().mockReturnValue('/private/media/file.mp4'), remove: vi.fn().mockResolvedValue(undefined) };
    processor = {};
    analyzer = { analyze: vi.fn() };
    service = new MediaService(
      prisma as PrismaService,
      storage as MediaStorageService,
      processor as MediaProcessorService,
      analyzer,
      { canAccessProfile: vi.fn() } as unknown as DiscoveryPrivacyService,
    );
  });

  function configureCleanupFixture(options: { reservationStatus?: string; assetStatus?: string; verification?: { id: string; status: string } | null; expiresAt?: Date } = {}) {
    const now = new Date();
    const reservation = {
      id: 'reservation-id', userId: 'owner-id', mediaType: 'AGE_INTERVIEW_VIDEO',
      status: options.reservationStatus ?? 'ACTIVE', reservedBytes: 1_000n,
      expiresAt: options.expiresAt ?? new Date(now.getTime() - 1),
    };
    const asset = {
      id: 'asset-id', reservationId: reservation.id, userId: reservation.userId,
      type: MediaType.AGE_INTERVIEW_VIDEO, processingStatus: options.assetStatus ?? 'UPLOADING',
      processingSlotAcquired: false, storageKey: 'videos/owner-id/asset.mp4', thumbnailStorageKey: null, originalSizeBytes: 1_024n,
    };
    const state = { reservation, asset, reservedBytes: 5_000n, quotaUpdates: 0, sessionUpdates: 0 };
    storage.remove = vi.fn().mockResolvedValue(undefined);
    storage.quarantinePath = vi.fn((id: string) => `/private/media/quarantine/${id}.source`);
    storage.temporaryPath = vi.fn((id: string, suffix: string) => `/private/media/temp/${id}${suffix}`);
    storage.permanentPath = vi.fn((_type: MediaType, key: string) => `/private/media/${key}`);
    prisma.mediaStorageReservation.findMany.mockResolvedValue([{ id: reservation.id }]);
    let tail = Promise.resolve();
    const tx = {
      $queryRaw: vi.fn(async () => ['ACTIVE', 'RECEIVING'].includes(state.reservation.status) ? [{ ...state.reservation }] : []),
      $executeRaw: vi.fn().mockResolvedValue(1),
      mediaAsset: {
        findFirst: vi.fn().mockResolvedValue(asset),
        updateMany: vi.fn(async ({ data }: any) => {
          state.asset.processingStatus = data.processingStatus;
          state.asset.processingSlotAcquired = data.processingSlotAcquired;
          return { count: 1 };
        }),
      },
      humanVerification: { findFirst: vi.fn().mockResolvedValue(options.verification ?? null) },
      mediaStorageReservation: {
        updateMany: vi.fn(async ({ data }: any) => {
          if (!['ACTIVE', 'RECEIVING'].includes(state.reservation.status)) return { count: 0 };
          state.reservation.status = data.status;
          return { count: 1 };
        }),
      },
      mediaStorageQuota: {
        updateMany: vi.fn(async ({ where, data }: any) => {
          if (state.reservedBytes < where.reservedBytes.gte) return { count: 0 };
          state.reservedBytes -= data.reservedBytes.decrement;
          state.quotaUpdates += 1;
          return { count: 1 };
        }),
      },
    };
    prisma.$transaction.mockImplementation(async (fn: any) => {
      const prior = tail;
      let release!: () => void;
      tail = new Promise<void>((resolve) => { release = resolve; });
      await prior;
      try { return await fn(tx); } finally { release(); }
    });
    return { now, state, tx };
  }

  it('rejects an upload exceeding the configured initial maximum before reserving capacity', async () => {
    await expect(service.reserveUpload('user-id', {
      mediaType: MediaType.PROFILE_PHOTO,
      contentLength: 250 * 1024 * 1024 + 1,
    })).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('atomically refuses reservation when the quota update cannot fit it', async () => {
    await expect(service.reserveUpload('user-id', {
      mediaType: MediaType.PROFILE_PHOTO,
      contentLength: 1024,
    })).rejects.toBeInstanceOf(ConflictException);
    expect(prisma.$transaction).toHaveBeenCalledOnce();
  });

  it('does not allow another user to read a private media asset', async () => {
    prisma.mediaAsset.findUnique.mockResolvedValue({
      id: 'asset-id', userId: 'owner-id', type: MediaType.AGE_INTERVIEW_VIDEO,
      processingStatus: 'READY', storageKey: 'age-interviews/owner/file.mp4',
    });
    await expect(service.getPrivateMedia('other-user', 'asset-id')).rejects.toBeInstanceOf(ForbiddenException);
    expect(storage.permanentPath).not.toHaveBeenCalled();
  });

  it('denies discovery photo retrieval across profile visibility boundaries', async () => {
    (service as any).discoveryPrivacy = { canAccessProfile: vi.fn().mockResolvedValue(false) };
    await expect(service.getDiscoveryProfilePhoto('viewer-id', 'owner-id', 'asset-id')).rejects.toMatchObject({ status: 404 });
    expect(prisma.mediaAsset.findFirst).not.toHaveBeenCalled();
    expect(storage.permanentPath).not.toHaveBeenCalled();
  });

  it('streams only a ready owned profile-photo asset after privacy authorization', async () => {
    (service as any).discoveryPrivacy = { canAccessProfile: vi.fn().mockResolvedValue(true) };
    prisma.mediaAsset.findFirst.mockResolvedValue({ id: 'asset-id', type: MediaType.PROFILE_PHOTO, storageKey: 'photos/owner/photo.webp', mimeType: 'image/webp', storedSizeBytes: 42 });
    await expect(service.getDiscoveryProfilePhoto('viewer-id', 'owner-id', 'asset-id')).resolves.toEqual({ path: '/private/media/file.mp4', mimeType: 'image/webp', size: 42 });
    expect(prisma.mediaAsset.findFirst).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ id: 'asset-id', userId: 'owner-id', type: MediaType.PROFILE_PHOTO, processingStatus: 'READY' }) }));
  });

  it('does not let a manipulated photo asset id escape the authorized owner scope', async () => {
    (service as any).discoveryPrivacy = { canAccessProfile: vi.fn().mockResolvedValue(true) };
    prisma.mediaAsset.findFirst.mockResolvedValue(null);
    await expect(service.getDiscoveryProfilePhoto('viewer-id', 'owner-id', 'another-users-asset-id')).rejects.toMatchObject({ status: 404 });
    expect(prisma.mediaAsset.findFirst).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ id: 'another-users-asset-id', userId: 'owner-id', type: MediaType.PROFILE_PHOTO }),
    }));
    expect(storage.permanentPath).not.toHaveBeenCalled();
  });

  it('allows the configured reviewer to stream a ready interview from private storage', async () => {
    process.env.CHOCOLATE_REVIEWER_USER_ID = 'reviewer-id';
    prisma.mediaAsset.findUnique.mockResolvedValue({
      id: 'asset-id', userId: 'owner-id', type: MediaType.AGE_INTERVIEW_VIDEO,
      processingStatus: 'READY', storageKey: 'videos/owner-id/file.mp4', mimeType: 'video/mp4', storedSizeBytes: 2048n,
    });
    await expect(service.getPrivateMedia('reviewer-id', 'asset-id')).resolves.toMatchObject({
      path: '/private/media/file.mp4', mimeType: 'video/mp4', size: 2048,
    });
    expect(storage.permanentPath).toHaveBeenCalledOnce();
  });

  it('denies reviewer access when the configured allowlist is absent', async () => {
    await expect(service.pendingReviews('user-id')).rejects.toMatchObject({ status: 503 });
  });

  it('denies reviewer access to a user other than the configured reviewer', async () => {
    process.env.CHOCOLATE_REVIEWER_USER_ID = 'reviewer-id';
    await expect(service.pendingReviews('different-user')).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('allows only the configured authenticated reviewer to list pending reviews', async () => {
    process.env.CHOCOLATE_REVIEWER_USER_ID = 'reviewer-id';
    prisma.humanVerification = { findMany: vi.fn().mockResolvedValue([]) };
    await service.pendingReviews('reviewer-id');
    expect(prisma.humanVerification.findMany).toHaveBeenCalledOnce();
  });

  it('records an approval with the authenticated reviewer identity and decision time', async () => {
    process.env.CHOCOLATE_REVIEWER_USER_ID = 'reviewer-id';
    prisma.humanVerification = {
      updateMany: vi.fn().mockResolvedValue({ count: 1 }),
      findUnique: vi.fn().mockResolvedValue({ id: 'verification-id', status: 'VERIFIED', reviewerUserId: 'reviewer-id', reviewedAt: new Date(), decisionReason: null }),
    };
    await expect(service.decideVerification('reviewer-id', 'verification-id', 'VERIFIED')).resolves.toMatchObject({ status: 'VERIFIED', reviewerUserId: 'reviewer-id' });
    expect(prisma.humanVerification.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ status: 'VERIFIED', reviewerUserId: 'reviewer-id', reviewedAt: expect.any(Date) }),
    }));
  });

  it('records a rejection reason and permits a subsequent upload after the rejected state', async () => {
    process.env.CHOCOLATE_REVIEWER_USER_ID = 'reviewer-id';
    prisma.humanVerification = {
      updateMany: vi.fn().mockResolvedValue({ count: 1 }),
      findUnique: vi.fn().mockResolvedValue({ id: 'verification-id', status: 'FAILED', reviewerUserId: 'reviewer-id', reviewedAt: new Date(), decisionReason: 'Please improve lighting.' }),
    };
    await expect(service.decideVerification('reviewer-id', 'verification-id', 'FAILED', 'Please improve lighting.')).resolves.toMatchObject({ status: 'FAILED', decisionReason: 'Please improve lighting.' });
    const findFirst = vi.fn().mockResolvedValue(null);
    const reservationFindFirst = vi.fn().mockResolvedValue(null);
    const sessionFindFirst = vi.fn().mockResolvedValue({ id: 'session-id', challengeTokenHash: createHash('sha256').update('token').digest('hex') });
    prisma.$transaction.mockImplementation((fn: any) => fn({
      $queryRaw: vi.fn().mockResolvedValue([]),
      $executeRaw: vi.fn().mockResolvedValue(1),
      user: { findUnique: vi.fn().mockResolvedValue({ accountStatus: 'ACTIVE' }) },
      humanVerification: { findFirst },
      mediaStorageReservation: { findFirst: reservationFindFirst, create: vi.fn() },
      mediaAsset: { create: vi.fn() },
      verificationSession: { findFirst: sessionFindFirst, updateMany: vi.fn().mockResolvedValue({ count: 1 }) },
    }));
    // Resubmission checks for unresolved reviews only; a rejected record is not a blocker.
    await service.reserveUpload('owner-id', { mediaType: MediaType.AGE_INTERVIEW_VIDEO, contentLength: 1024, verificationSessionId: 'session-id', challengeToken: 'token' });
    expect(findFirst).toHaveBeenCalledWith(expect.objectContaining({ where: { userId: 'owner-id', status: { in: ['PENDING', 'MANUAL_REVIEW'] } } }));
  });

  it('rejects a verification session that does not belong to the authenticated uploader', async () => {
    prisma.$transaction.mockImplementation((fn: any) => fn({
      $queryRaw: vi.fn().mockResolvedValue([]),
      user: { findUnique: vi.fn().mockResolvedValue({ accountStatus: 'ACTIVE' }) },
      humanVerification: { findFirst: vi.fn().mockResolvedValue(null) },
      mediaStorageReservation: { findFirst: vi.fn().mockResolvedValue(null) },
      verificationSession: { findFirst: vi.fn().mockResolvedValue(null) },
    }));
    await expect(service.reserveUpload('attacker-id', {
      mediaType: MediaType.AGE_INTERVIEW_VIDEO,
      contentLength: 1024,
      verificationSessionId: 'another-users-session',
      challengeToken: 'token',
    })).rejects.toBeInstanceOf(BadRequestException);
  });

  it('prevents a second submission while a review is pending', async () => {
    prisma.$transaction.mockImplementation((fn: any) => fn({
      $queryRaw: vi.fn().mockResolvedValue([]),
      user: { findUnique: vi.fn().mockResolvedValue({ accountStatus: 'ACTIVE' }) },
      humanVerification: { findFirst: vi.fn().mockResolvedValue({ id: 'pending-id' }) },
      mediaStorageReservation: { findFirst: vi.fn().mockResolvedValue(null) },
    }));
    await expect(service.reserveUpload('user-id', {
      mediaType: MediaType.AGE_INTERVIEW_VIDEO,
      contentLength: 1024,
      verificationSessionId: 'session-id',
      challengeToken: 'token',
    })).rejects.toBeInstanceOf(ConflictException);
  });

  it('reconciles an expired active reservation and marks only its incomplete asset failed', async () => {
    const { now, state, tx } = configureCleanupFixture();
    await expect(service.cleanupStaleUploads(now)).resolves.toBe(1);
    expect(state.reservation.status).toBe('RELEASED');
    expect(state.asset.processingStatus).toBe('FAILED');
    expect(state.reservedBytes).toBe(4_000n);
    expect(tx.mediaStorageQuota.updateMany).toHaveBeenCalledOnce();
    expect(storage.remove).toHaveBeenCalledWith('/private/media/quarantine/reservation-id.source');
    expect(storage.remove).toHaveBeenCalledWith('/private/media/temp/asset-id.mp4');
  });

  it('restores quota once when a failed upload is released', async () => {
    const { state, tx } = configureCleanupFixture({ expiresAt: new Date(Date.now() + 60_000) });
    await (service as any).failUpload('reservation-id', 'asset-id');
    await (service as any).failUpload('reservation-id', 'asset-id');
    expect(state.reservation.status).toBe('RELEASED');
    expect(state.reservedBytes).toBe(4_000n);
    expect(tx.mediaStorageQuota.updateMany).toHaveBeenCalledOnce();
  });

  it.each([
    ['client disconnect', vi.fn().mockRejectedValue(new Error('client disconnected'))],
    ['incomplete body', vi.fn().mockResolvedValue(128)],
  ])('releases reservation and quota after %s during content receive', async (_failure, writeUpload) => {
    const { state, tx: releaseTx } = configureCleanupFixture({ expiresAt: new Date(Date.now() + 60_000) });
    state.reservation.reservedBytes = 1_000n;
    const claimedReservation = { ...state.reservation, mediaAsset: state.asset };
    const claimTx = {
      mediaStorageReservation: {
        findFirst: vi.fn().mockResolvedValue(claimedReservation),
        updateMany: vi.fn().mockImplementation(async ({ data }: any) => {
          state.reservation.status = data.status;
          state.reservation.expiresAt = data.expiresAt;
          return { count: 1 };
        }),
      },
    };
    let transactionNumber = 0;
    prisma.$transaction.mockImplementation((fn: any) => {
      transactionNumber += 1;
      return fn(transactionNumber === 1 ? claimTx : releaseTx);
    });
    storage.writeUpload = writeUpload;
    await expect(service.receiveUpload('owner-id', 'reservation-id', 1_024, Readable.from([]))).rejects.toBeDefined();
    expect(state.reservation.status).toBe('RELEASED');
    expect(state.asset.processingStatus).toBe('FAILED');
    expect(state.reservedBytes).toBe(4_000n);
    expect(releaseTx.mediaStorageQuota.updateMany).toHaveBeenCalledOnce();
  });

  it('does not double-release quota when cleanup runs repeatedly or concurrently', async () => {
    const { now, state, tx } = configureCleanupFixture();
    const results = await Promise.all([service.cleanupStaleUploads(now), service.cleanupStaleUploads(now)]);
    expect(results.sort()).toEqual([0, 1]);
    expect(state.reservation.status).toBe('RELEASED');
    expect(state.reservedBytes).toBe(4_000n);
    expect(tx.mediaStorageQuota.updateMany).toHaveBeenCalledOnce();
  });

  it.each(['PENDING', 'MANUAL_REVIEW', 'VERIFIED', 'FAILED'] as const)(
    'never cleans an asset associated with a %s HumanVerification', async (status) => {
      const { now, state, tx } = configureCleanupFixture({ verification: { id: 'verification-id', status } });
      await expect(service.cleanupStaleUploads(now)).resolves.toBe(0);
      expect(state.reservation.status).toBe('ACTIVE');
      expect(state.asset.processingStatus).toBe('UPLOADING');
      expect(tx.mediaStorageQuota.updateMany).not.toHaveBeenCalled();
      expect(storage.remove).not.toHaveBeenCalled();
    },
  );

  it('does not remove a committed video during incomplete-upload cleanup', async () => {
    const { now, tx } = configureCleanupFixture({ reservationStatus: 'COMMITTED', assetStatus: 'READY' });
    await expect(service.cleanupStaleUploads(now)).resolves.toBe(0);
    expect(tx.mediaStorageQuota.updateMany).not.toHaveBeenCalled();
    expect(storage.remove).not.toHaveBeenCalled();
  });

  it('reconciles an expired attempt and allows a fresh reservation', async () => {
    const { now, state, tx: cleanupTx } = configureCleanupFixture();
    prisma.mediaStorageReservation.findMany.mockResolvedValue([{ id: 'reservation-id' }]);
    const validSession = { id: 'new-session', challengeTokenHash: createHash('sha256').update('new-token').digest('hex') };
    const reserveTx = {
      $queryRaw: vi.fn().mockResolvedValue([]),
      $executeRaw: vi.fn().mockResolvedValue(1),
      user: { findUnique: vi.fn().mockResolvedValue({ accountStatus: 'ACTIVE' }) },
      humanVerification: { findFirst: vi.fn().mockResolvedValue(null) },
      mediaStorageReservation: { findFirst: vi.fn().mockResolvedValue(null), create: vi.fn() },
      mediaStorageQuota: { findUnique: vi.fn().mockResolvedValue({ usedBytes: 0n, reservedBytes: 0n }) },
      mediaAsset: { create: vi.fn() },
      verificationSession: { findFirst: vi.fn().mockResolvedValue(validSession), updateMany: vi.fn().mockResolvedValue({ count: 1 }) },
    };
    let transactionNumber = 0;
    prisma.$transaction.mockImplementation((fn: any) => {
      transactionNumber += 1;
      return fn(transactionNumber === 1 ? cleanupTx : reserveTx);
    });
    await expect(service.reserveUpload('owner-id', {
      mediaType: MediaType.AGE_INTERVIEW_VIDEO,
      contentLength: 1024,
      verificationSessionId: 'new-session',
      challengeToken: 'new-token',
    })).resolves.toMatchObject({ uploadPath: expect.stringContaining('/media/storage-reservations/') });
    expect(state.reservation.status).toBe('RELEASED');
    expect(reserveTx.mediaStorageReservation.create).toHaveBeenCalledOnce();
    expect(reserveTx.mediaAsset.create).toHaveBeenCalledOnce();
  });

  it('serializes concurrent retry reservations so only one is created', async () => {
    prisma.mediaStorageReservation.findMany.mockResolvedValue([]);
    const validSession = { id: 'session-id', challengeTokenHash: createHash('sha256').update('token').digest('hex') };
    let activeReservation: { id: string } | null = null;
    let createCount = 0;
    let tail = Promise.resolve();
    prisma.$transaction.mockImplementation(async (fn: any) => {
      const prior = tail;
      let release!: () => void;
      tail = new Promise<void>((resolve) => { release = resolve; });
      await prior;
      const tx = {
        $queryRaw: vi.fn().mockResolvedValue([]),
        $executeRaw: vi.fn().mockResolvedValue(1),
        user: { findUnique: vi.fn().mockResolvedValue({ accountStatus: 'ACTIVE' }) },
        humanVerification: { findFirst: vi.fn().mockResolvedValue(null) },
        mediaStorageReservation: {
          findFirst: vi.fn().mockImplementation(async () => activeReservation),
          create: vi.fn().mockImplementation(async () => { activeReservation = { id: `created-${++createCount}` }; }),
        },
        mediaStorageQuota: { findUnique: vi.fn().mockResolvedValue({ usedBytes: 0n, reservedBytes: 0n }) },
        mediaAsset: { create: vi.fn() },
        verificationSession: { findFirst: vi.fn().mockResolvedValue(validSession), updateMany: vi.fn().mockResolvedValue({ count: 1 }) },
      };
      try { return await fn(tx); } finally { release(); }
    });
    const input = { mediaType: MediaType.AGE_INTERVIEW_VIDEO, contentLength: 1024, verificationSessionId: 'session-id', challengeToken: 'token' };
    const results = await Promise.allSettled([service.reserveUpload('owner-id', input), service.reserveUpload('owner-id', input)]);
    expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(1);
    expect(results.filter((result) => result.status === 'rejected')).toHaveLength(1);
    expect(createCount).toBe(1);
  });

  it('retains submitted interview videos until account deletion', async () => {
    prisma.mediaAsset.findFirst.mockResolvedValue({ id: 'asset-id', userId: 'owner-id', type: MediaType.AGE_INTERVIEW_VIDEO, processingStatus: 'READY' });
    await expect(service.removeOwnMedia('owner-id', 'asset-id')).rejects.toBeInstanceOf(ConflictException);
    expect(storage.remove).not.toHaveBeenCalled();
    expect(prisma.mediaAsset.findFirst).toHaveBeenCalledWith({ where: { id: 'asset-id', userId: 'owner-id' } });
  });

  it('does not allow a reviewer to list their own submissions', async () => {
    process.env.CHOCOLATE_REVIEWER_USER_ID = 'reviewer-id';
    prisma.humanVerification = { findMany: vi.fn().mockResolvedValue([]) };
    await service.pendingReviews('reviewer-id');
    expect(prisma.humanVerification.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ userId: { not: 'reviewer-id' } }),
    }));
  });

  it('prevents reviewers from deciding their own submission', async () => {
    process.env.CHOCOLATE_REVIEWER_USER_ID = 'reviewer-id';
    prisma.humanVerification = { updateMany: vi.fn().mockResolvedValue({ count: 0 }) };
    await expect(service.decideVerification('reviewer-id', 'submission-id', 'VERIFIED')).rejects.toMatchObject({ status: 404 });
    expect(prisma.humanVerification.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ userId: { not: 'reviewer-id' } }),
    }));
  });

  it('requires a rejection reason', async () => {
    process.env.CHOCOLATE_REVIEWER_USER_ID = 'reviewer-id';
    await expect(service.decideVerification('reviewer-id', 'submission-id', 'FAILED')).rejects.toBeInstanceOf(BadRequestException);
  });

  it('schedules account deletion after the seven-day grace period and creates a durable job', async () => {
    prisma.user.findUnique.mockResolvedValue({ accountStatus: 'ACTIVE', deletionRequestedAt: null, deletionScheduledAt: null });
    prisma.$transaction.mockImplementation((fn: any) => fn({
      user: { update: vi.fn() },
      mediaDeletionJob: { upsert: vi.fn() },
    }));
    const result = await service.requestAccountDeletion('owner-id');
    if (!result.requestedAt || !result.scheduledAt) throw new Error('Expected scheduled deletion timestamps.');
    expect(result.scheduledAt.getTime() - result.requestedAt.getTime()).toBe(7 * 24 * 60 * 60 * 1000);
    expect(prisma.$transaction).toHaveBeenCalledOnce();
  });

  it('retries a deletion job after a cleanup failure with a future due time', async () => {
    const now = new Date('2026-11-16T00:00:00Z');
    const update = vi.fn().mockResolvedValue({});
    prisma.mediaDeletionJob = {
      findMany: vi.fn().mockResolvedValue([{ id: 'job-id', userId: 'owner-id', attempts: 0 }]),
      updateMany: vi.fn().mockResolvedValue({ count: 1 }),
      update,
    };
    prisma.mediaAsset = { findMany: vi.fn().mockRejectedValue(new Error('temporary storage error')) };
    prisma.mediaStorageReservation = { findMany: vi.fn().mockResolvedValue([]) };
    await expect(service.processDueDeletionJobs(now)).resolves.toBe(0);
    expect(update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'job-id' },
      data: expect.objectContaining({ status: 'RETRY', lastErrorCode: 'MEDIA_CLEANUP_RETRY' }),
    }));
    const retryAt = update.mock.calls[0][0].data.nextAttemptAt as Date;
    expect(retryAt.getTime()).toBe(now.getTime() + 60_000);
  });

  it('scans actual media disk usage and leaves files untouched', async () => {
    const root = await mkdtemp(join(tmpdir(), 'chocolate-media-scan-'));
    const previousRoot = process.env.MEDIA_STORAGE_ROOT;
    process.env.MEDIA_STORAGE_ROOT = root;
    const scanned = new MediaService(
      prisma as PrismaService,
      storage as MediaStorageService,
      processor as MediaProcessorService,
      analyzer,
      { canAccessProfile: vi.fn() } as unknown as DiscoveryPrivacyService,
    );
    const file = join(root, 'existing-media.bin');
    await writeFile(file, 'media-bytes');
    try {
      await scanned.scanStorageUsage();
      await expect(readFile(file, 'utf8')).resolves.toBe('media-bytes');
      expect(prisma.mediaStorageQuota.findUnique).toHaveBeenCalledWith({ where: { id: 1 } });
    } finally {
      if (previousRoot === undefined) delete process.env.MEDIA_STORAGE_ROOT;
      else process.env.MEDIA_STORAGE_ROOT = previousRoot;
      await rm(root, { recursive: true, force: true });
    }
  });

  it('blocks uploads after account deletion has been requested', async () => {
    prisma.user.findUnique.mockResolvedValue({ accountStatus: 'PENDING_DELETION' });
    await expect(service.reserveUpload('user-id', {
      mediaType: MediaType.PROFILE_PHOTO,
      contentLength: 1024,
    })).rejects.toBeInstanceOf(ForbiddenException);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });
});
