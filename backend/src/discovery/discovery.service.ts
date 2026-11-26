import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, ProfileReactionType } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { areMeetingPreferencesCompatible, DiscoveryPrivacyService, isAdult } from './discovery-privacy.service.js';
import { coarsenDiscoveryCoordinate } from './discovery-rate-limit.service.js';
import type { LocationSearchDto, NearbyDiscoveryDto, ProfileActionDto, UpdatePrivacySettingsDto } from './discovery.dto.js';
import type { DiscoveryMode } from '../profile/dto/update-discovery-modes.dto.js';

const ALLOWED_RADII = [5, 10, 25, 50, 100];
type GeoPoint = { latitude: number; longitude: number; areaLabel?: string; radiusKm?: number };
type CandidateRow = { userId: string; distanceBand: string | null };

@Injectable()
export class DiscoveryService {
  constructor(private readonly prisma: PrismaService, private readonly visibility: DiscoveryPrivacyService) {}

  async getPrivacySettings(userId: string) {
    const settings = await this.prisma.profilePrivacySetting.findUnique({ where: { userId } });
    return settings ?? { userId, contactLockEnabled: false, neighbourhoodLockEnabled: false, areaExclusionEnabled: false, undiscoverableEnabled: false, excludedArea: null };
  }

  async updatePrivacySettings(userId: string, input: UpdatePrivacySettingsDto) {
    const previous = await this.prisma.profilePrivacySetting.findUnique({ where: { userId } });
    const areaEnabled = input.areaExclusionEnabled ?? previous?.areaExclusionEnabled ?? false;
    const areaLabel = input.excludedArea !== undefined ? input.excludedArea?.trim() || null : previous?.excludedArea ?? null;
    const latitude = input.excludedLatitude ?? undefined;
    const longitude = input.excludedLongitude ?? undefined;
    if (areaEnabled && (!areaLabel || latitude === undefined || longitude === undefined)) {
      if (!previous?.excludedArea || input.excludedArea !== undefined || input.excludedLatitude !== undefined || input.excludedLongitude !== undefined) {
        throw new BadRequestException('Choose a valid area before enabling Area Exclusion.');
      }
    }
    const contactLockEnabled = input.contactLockEnabled ?? previous?.contactLockEnabled ?? false;
    if (contactLockEnabled && input.contacts === undefined) {
      const existingContactCount = await this.prisma.profileContactHash.count({ where: { userId } });
      if (existingContactCount === 0) throw new BadRequestException('Contact Lock requires a contact list to be synchronized.');
    }
    if (contactLockEnabled && input.contacts !== undefined) {
      const normalized = this.visibility.contactDigests(input.contacts);
      if (normalized.length === 0) throw new BadRequestException('At least one valid contact is required to enable Contact Lock.');
    }
    await this.prisma.$transaction(async tx => {
      await tx.profilePrivacySetting.upsert({
        where: { userId },
        create: {
          userId,
          contactLockEnabled,
          neighbourhoodLockEnabled: input.neighbourhoodLockEnabled ?? false,
          areaExclusionEnabled: areaEnabled,
          undiscoverableEnabled: input.undiscoverableEnabled ?? false,
          excludedArea: areaLabel,
        },
        update: {
          ...(input.contactLockEnabled !== undefined ? { contactLockEnabled } : {}),
          ...(input.neighbourhoodLockEnabled !== undefined ? { neighbourhoodLockEnabled: input.neighbourhoodLockEnabled } : {}),
          ...(input.areaExclusionEnabled !== undefined ? { areaExclusionEnabled: areaEnabled } : {}),
          ...(input.undiscoverableEnabled !== undefined ? { undiscoverableEnabled: input.undiscoverableEnabled } : {}),
          ...(input.excludedArea !== undefined ? { excludedArea: areaLabel } : {}),
        },
      });
      if (input.excludedLatitude !== undefined && input.excludedLongitude !== undefined) {
        await tx.$executeRaw`
          UPDATE "ProfilePrivacySetting"
          SET "excludedLocation" = ST_SetSRID(ST_MakePoint(${input.excludedLongitude}, ${input.excludedLatitude}), 4326)::geography,
              "updatedAt" = NOW()
          WHERE "userId" = ${userId}::uuid
        `;
      }
      if (input.contacts !== undefined) {
        const digests = this.visibility.contactDigests(input.contacts);
        await tx.profileContactHash.deleteMany({ where: { userId } });
        if (digests.length) await tx.profileContactHash.createMany({ data: digests.map(digest => ({ userId, digest })) });
      }
      if (!contactLockEnabled) await tx.profileContactHash.deleteMany({ where: { userId } });
    });
    return this.getPrivacySettings(userId);
  }

  async nearby(userId: string, input: NearbyDiscoveryDto) {
    await this.saveGeoLocation(userId, input);
    return this.getFeed(userId, { locationFilter: 'nearby' });
  }

  async locationSearch(userId: string, input: LocationSearchDto) {
    this.assertRadius(input.radiusKm);
    await this.prisma.$executeRaw`
      INSERT INTO "DiscoverySearchPreference" ("userId", "location", "areaLabel", "radiusKm", "updatedAt")
      VALUES (${userId}::uuid, ST_SetSRID(ST_MakePoint(${coarsenDiscoveryCoordinate(input.longitude)}, ${coarsenDiscoveryCoordinate(input.latitude)}), 4326)::geography, ${input.locationLabel.trim()}, ${input.radiusKm}, NOW())
      ON CONFLICT ("userId") DO UPDATE SET
        "location" = EXCLUDED."location", "areaLabel" = EXCLUDED."areaLabel", "radiusKm" = EXCLUDED."radiusKm", "updatedAt" = NOW()
    `;
    return this.getFeed(userId, { locationFilter: 'search' });
  }

  async getLocationSearchPreference(userId: string) {
    const rows = await this.prisma.$queryRaw<Array<{ areaLabel: string; radiusKm: number }>>`
      SELECT "areaLabel", "radiusKm" FROM "DiscoverySearchPreference" WHERE "userId" = ${userId}::uuid
    `;
    return rows[0] ?? null;
  }

  async getNearbyPreference(userId: string) {
    const rows = await this.prisma.$queryRaw<Array<{ areaLabel: string | null; radiusKm: number }>>`
      SELECT "areaLabel", "radiusKm" FROM "ProfileGeoLocation" WHERE "userId" = ${userId}::uuid
    `;
    return rows[0] ?? null;
  }

  private async saveGeoLocation(userId: string, input: NearbyDiscoveryDto) {
    this.assertRadius(input.radiusKm);
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { accountStatus: true } });
    if (!user || user.accountStatus !== 'ACTIVE') throw new ForbiddenException('Account is not available for discovery.');
    await this.prisma.$executeRaw`
      INSERT INTO "ProfileGeoLocation" ("userId", "location", "areaLabel", "radiusKm", "updatedAt")
      VALUES (${userId}::uuid, ST_SetSRID(ST_MakePoint(${coarsenDiscoveryCoordinate(input.longitude)}, ${coarsenDiscoveryCoordinate(input.latitude)}), 4326)::geography, ${input.areaLabel?.trim() || null}, ${input.radiusKm}, NOW())
      ON CONFLICT ("userId") DO UPDATE SET
        "location" = EXCLUDED."location", "areaLabel" = EXCLUDED."areaLabel", "radiusKm" = EXCLUDED."radiusKm", "updatedAt" = NOW()
    `;
  }

  private async getSavedDiscoveryMode(userId: string, requestedMode?: DiscoveryMode): Promise<DiscoveryMode> {
    const rows = await this.prisma.discoveryModeSelection.findMany({ where: { userId }, select: { mode: true } });
    const savedModes = rows.map(({ mode }) => mode).filter((mode): mode is DiscoveryMode =>
      mode === 'algorithmic' || mode === 'browse' || mode === 'kismat');
    if (savedModes.length === 0) {
      const hasLegacyNearby = rows.some(({ mode }) => mode === 'nearby');
      throw new BadRequestException(hasLegacyNearby
        ? 'Choose an Algorithmic, Browse, or KISMAT mode. Your legacy Nearby selection is preserved as a location preference.'
        : 'Choose a discovery mode before requesting profiles.');
    }
    if (savedModes.length > 1) {
      throw new ConflictException('Multiple discovery modes are saved. Choose one mode to replace the legacy selection.');
    }
    const savedMode = savedModes[0];
    if (requestedMode && requestedMode !== savedMode) {
      throw new ForbiddenException('The requested discovery mode is not your saved mode.');
    }
    return savedMode;
  }

  async getFeed(userId: string, options: { mode?: DiscoveryMode; locationFilter?: 'nearby' | 'search'; query?: string; targetId?: string; page?: number; pageSize?: number } = {}) {
    const mode = await this.getSavedDiscoveryMode(userId, options.mode);
    const viewer = await this.prisma.profile.findUnique({
      where: { userId }, include: { interestedIn: true, owner: { select: { accountStatus: true, dateOfBirth: true } } },
    });
    if (!viewer?.completedAt) throw new ForbiddenException('Complete your profile to use discovery.');
    if (viewer.owner.accountStatus !== 'ACTIVE' || !isAdult(viewer.owner.dateOfBirth)) {
      throw new ForbiddenException('Account is not eligible for discovery.');
    }
    const storedPoint = options.locationFilter === 'search'
      ? await this.getStoredPoint('DiscoverySearchPreference', userId)
      : await this.getStoredPoint('ProfileGeoLocation', userId);
    const radiusKm = options.locationFilter ? storedPoint?.radiusKm ?? null : null;
    if (options.locationFilter && !storedPoint) throw new BadRequestException('Choose a search location first.');
    const locationSql = storedPoint
      ? Prisma.sql`ST_SetSRID(ST_MakePoint(${storedPoint.longitude}, ${storedPoint.latitude}), 4326)::geography`
      : Prisma.sql`NULL::geography`;
    const viewerMeeting = viewer.interestedIn.map(item => item.value);
    if (!viewerMeeting.length || viewerMeeting.includes('Prefer not to say')) return [];
    const page = Math.max(0, Math.min(options.page ?? 0, 9));
    const pageSize = Math.max(1, Math.min(options.pageSize ?? 30, 30));
    const viewerContactDigests = this.visibility.contactDigests([...(await this.getViewerContactValues(userId))]);
    const radiusFilter = radiusKm === null ? Prisma.empty : Prisma.sql`AND loc."location" IS NOT NULL AND ST_DWithin(loc."location", origin."point", ${radiusKm * 1000})`;
    const query = options.query?.trim();
    const escapedQuery = query?.replace(/[\\%_]/g, value => `\\${value}`);
    const searchFilter = escapedQuery ? Prisma.sql`AND (p."displayName" ILIKE ${`%${escapedQuery}%`} ESCAPE '\\' OR COALESCE(p."bio", '') ILIKE ${`%${escapedQuery}%`} ESCAPE '\\' OR COALESCE(loc."areaLabel", '') ILIKE ${`%${escapedQuery}%`} ESCAPE '\\')` : Prisma.empty;
    const targetFilter = options.targetId ? Prisma.sql`AND u."id" = ${options.targetId}::uuid` : Prisma.empty;
    const reactionFilter = options.targetId ? Prisma.empty : Prisma.sql`AND NOT EXISTS (
          SELECT 1 FROM "ProfileReaction" r WHERE r."actorId" = ${userId}::uuid AND r."targetId" = u."id" AND r."action" IN ('LIKE', 'SUPER_LIKE', 'PASS')
        )`;
    const candidates = await this.prisma.$queryRaw<CandidateRow[]>`
      SELECT u."id" AS "userId",
        CASE WHEN origin."point" IS NULL OR loc."location" IS NULL THEN NULL
          WHEN ST_Distance(loc."location", origin."point") <= 10000 THEN 'Within 10 km'
          WHEN ST_Distance(loc."location", origin."point") <= 50000 THEN '10–50 km'
          ELSE 'Over 50 km' END AS "distanceBand"
      FROM "User" u
      JOIN "Profile" p ON p."userId" = u."id"
      LEFT JOIN "ProfileGeoLocation" loc ON loc."userId" = u."id"
      LEFT JOIN "ProfilePrivacySetting" candidate_privacy ON candidate_privacy."userId" = u."id"
      LEFT JOIN "ProfilePrivacySetting" viewer_privacy ON viewer_privacy."userId" = ${userId}::uuid
      LEFT JOIN LATERAL (
        SELECT ST_SetSRID(ST_MakePoint(ROUND(ST_X(gl."location"::geometry)::numeric, 2)::float8, ROUND(ST_Y(gl."location"::geometry)::numeric, 2)::float8), 4326)::geography AS "location"
        FROM "ProfileGeoLocation" gl WHERE gl."userId" = ${userId}::uuid AND gl."location" IS NOT NULL
      ) viewer_loc ON TRUE
      LEFT JOIN LATERAL (
        SELECT ST_SetSRID(ST_MakePoint(ROUND(ST_X(sp."location"::geometry)::numeric, 2)::float8, ROUND(ST_Y(sp."location"::geometry)::numeric, 2)::float8), 4326)::geography AS "location"
        FROM "DiscoverySearchPreference" sp WHERE sp."userId" = ${userId}::uuid AND sp."location" IS NOT NULL
      ) viewer_search ON TRUE
      CROSS JOIN (SELECT ${locationSql} AS "point") origin
      WHERE u."id" <> ${userId}::uuid
        AND u."accountStatus" = 'ACTIVE'
        AND u."dateOfBirth" <= CURRENT_DATE - INTERVAL '18 years'
        AND p."completedAt" IS NOT NULL
        AND EXISTS (SELECT 1 FROM "HumanVerification" hv WHERE hv."userId" = u."id" AND hv."status" = 'VERIFIED' AND hv."mediaAssetType" = 'AGE_INTERVIEW_VIDEO' AND hv."mediaProcessingStatus" = 'READY')
        AND EXISTS (SELECT 1 FROM "ProfilePhoto" pp JOIN "MediaAsset" ma ON ma."id" = pp."assetId" WHERE pp."userId" = u."id" AND ma."type" = 'PROFILE_PHOTO' AND ma."processingStatus" = 'READY')
        AND NOT COALESCE(candidate_privacy."undiscoverableEnabled", false)
        AND NOT (
          COALESCE(candidate_privacy."contactLockEnabled", false)
          AND EXISTS (SELECT 1 FROM "ProfileContactHash" ch WHERE ch."userId" = u."id" AND ch."digest" = ANY(${viewerContactDigests}::text[]))
        )
        AND (
          NOT COALESCE(candidate_privacy."areaExclusionEnabled", false)
          OR (candidate_privacy."excludedLocation" IS NOT NULL
            AND (viewer_loc."location" IS NOT NULL OR viewer_search."location" IS NOT NULL)
            AND (viewer_loc."location" IS NULL OR NOT ST_DWithin(candidate_privacy."excludedLocation", viewer_loc."location", ${DiscoveryPrivacyService.areaExclusionMeters}))
            AND (viewer_search."location" IS NULL OR NOT ST_DWithin(candidate_privacy."excludedLocation", viewer_search."location", ${DiscoveryPrivacyService.areaExclusionMeters})))
        )
        AND (
          NOT COALESCE(viewer_privacy."areaExclusionEnabled", false)
          OR (viewer_privacy."excludedLocation" IS NOT NULL AND loc."location" IS NOT NULL
            AND NOT ST_DWithin(viewer_privacy."excludedLocation", loc."location", ${DiscoveryPrivacyService.areaExclusionMeters}))
        )
        AND (
          NOT COALESCE(candidate_privacy."neighbourhoodLockEnabled", false)
          OR (viewer_loc."location" IS NOT NULL AND loc."location" IS NOT NULL
            AND NOT ST_DWithin(viewer_loc."location", loc."location", ${DiscoveryPrivacyService.neighbourhoodMeters}))
        )
        AND (
          NOT COALESCE(viewer_privacy."neighbourhoodLockEnabled", false)
          OR (viewer_loc."location" IS NOT NULL AND loc."location" IS NOT NULL
            AND NOT ST_DWithin(viewer_loc."location", loc."location", ${DiscoveryPrivacyService.neighbourhoodMeters}))
        )
        ${reactionFilter}
        ${radiusFilter}
        ${searchFilter}
        ${targetFilter}
        ${mode === 'kismat' ? Prisma.empty : Prisma.sql`ORDER BY CASE WHEN origin."point" IS NOT NULL THEN ST_Distance(loc."location", origin."point") END ASC, p."createdAt" DESC`}
        ${mode === 'kismat' ? Prisma.empty : Prisma.sql`LIMIT ${pageSize} OFFSET ${page * pageSize}`}
    `;
    if (!candidates.length) return [];
    const targets = await this.prisma.profile.findMany({
      where: { userId: { in: candidates.map(candidate => candidate.userId) } },
      include: {
        interestedIn: true,
        interests: true,
        owner: { select: { dateOfBirth: true } },
        photos: {
          where: { asset: { type: 'PROFILE_PHOTO', processingStatus: 'READY' } },
          orderBy: [{ isMain: 'desc' }, { position: 'asc' }],
          take: 1,
          include: { asset: { select: { id: true } } },
        },
      },
    });
    const viewerGender = viewer.genderIdentity;
    const profileById = new Map(targets.map(target => [target.userId, target]));
    const eligibleProfiles = candidates.flatMap(candidate => {
      const profile = profileById.get(candidate.userId);
      if (!profile || !profile.displayName || !areMeetingPreferencesCompatible(viewerMeeting, viewerGender, profile.interestedIn.map(item => item.value), profile.genderIdentity)) return [];
      const photo = profile.photos[0];
      if (!photo) return [];
      return [{
        id: profile.userId,
        name: profile.displayName,
        age: calculateAge(profile.owner.dateOfBirth),
        distanceKm: null,
        distanceBand: candidate.distanceBand,
        location: '',
        profession: '',
        interests: profile.interests.map(item => item.value).join(' · '),
        about: profile.bio ?? '',
        image: `/media/discovery-profiles/${profile.userId}/${photo.asset.id}/content`,
        online: false,
        isSaved: false,
      }];
    });
    if (mode === 'kismat') {
      if (!eligibleProfiles.length) return [];
      return [eligibleProfiles[Math.floor(Math.random() * eligibleProfiles.length)]];
    }
    return eligibleProfiles;
  }

  async getProfile(userId: string, targetId: string) {
    if (!await this.visibility.canAccessProfile(userId, targetId)) throw new NotFoundException('Profile is not available.');
    const list = await this.getFeed(userId, { targetId });
    const profile = list[0];
    if (!profile) throw new NotFoundException('Profile is not available.');
    const [details, saved, verification, intents] = await Promise.all([
      this.prisma.profile.findUnique({
        where: { userId: targetId },
        include: {
          interestedIn: true,
          languages: true,
          lifestyles: true,
          values: true,
          conversationStyles: true,
          photos: {
            where: { asset: { type: 'PROFILE_PHOTO', processingStatus: 'READY' } },
            orderBy: [{ isMain: 'desc' }, { position: 'asc' }],
            include: { asset: { select: { id: true } } },
          },
        },
      }),
      this.prisma.savedProfile.findUnique({ where: { ownerId_targetId: { ownerId: userId, targetId } }, select: { ownerId: true } }),
      this.prisma.humanVerification.findFirst({
        where: { userId: targetId, status: 'VERIFIED', mediaAssetType: 'AGE_INTERVIEW_VIDEO', mediaProcessingStatus: 'READY' },
        select: { id: true },
      }),
      this.prisma.datingIntentSelection.findMany({ where: { userId: targetId }, select: { intent: true } }),
    ]);
    if (!details) throw new NotFoundException('Profile is not available.');
    const photos = details.photos.map(photo => ({ uri: `/media/discovery-profiles/${targetId}/${photo.asset.id}/content`, isMain: photo.isMain }));
    return {
      ...profile,
      genderIdentity: details.genderIdentity,
      interestedIn: details.interestedIn.map(item => item.value),
      prompt: details.selectedPrompt,
      languages: details.languages.map(item => item.value),
      lifestyles: details.lifestyles.map(item => item.value),
      values: details.values.map(item => item.value),
      conversationStyles: details.conversationStyles.map(item => item.value),
      datingIntents: intents.map(item => item.intent),
      photos,
      verified: Boolean(verification),
      isSaved: Boolean(saved),
    };
  }

  async action(userId: string, targetId: string, input: ProfileActionDto) {
    if (!await this.visibility.canAccessProfile(userId, targetId)) throw new NotFoundException('Profile is not available.');
    await this.prisma.$transaction(async tx => {
      if (input.action !== ProfileReactionType.VIEW) {
        await tx.profileReaction.deleteMany({ where: { actorId: userId, targetId, action: { in: [ProfileReactionType.LIKE, ProfileReactionType.SUPER_LIKE, ProfileReactionType.PASS] } } });
      }
      await tx.profileReaction.upsert({
        where: { actorId_targetId_action: { actorId: userId, targetId, action: input.action } },
        create: { actorId: userId, targetId, action: input.action },
        update: { createdAt: new Date() },
      });
    });
    const [theirReaction] = input.action === ProfileReactionType.LIKE || input.action === ProfileReactionType.SUPER_LIKE
      ? await this.prisma.profileReaction.findMany({ where: { actorId: targetId, targetId: userId, action: { in: [ProfileReactionType.LIKE, ProfileReactionType.SUPER_LIKE] } }, take: 1 })
      : [];
    return { action: input.action, mutualMatch: Boolean(theirReaction) };
  }

  async saveProfile(userId: string, targetId: string) {
    if (!await this.visibility.canAccessProfile(userId, targetId)) throw new NotFoundException('Profile is not available.');
    await this.prisma.savedProfile.upsert({ where: { ownerId_targetId: { ownerId: userId, targetId } }, create: { ownerId: userId, targetId }, update: {} });
    return { saved: true };
  }

  async unsaveProfile(userId: string, targetId: string) {
    await this.prisma.savedProfile.deleteMany({ where: { ownerId: userId, targetId } });
    return { saved: false };
  }

  async getStats(userId: string) {
    const [likes, matchedRows] = await Promise.all([
      this.prisma.profileReaction.count({ where: { targetId: userId, action: { in: [ProfileReactionType.LIKE, ProfileReactionType.SUPER_LIKE] } } }),
      this.prisma.$queryRaw<Array<{ count: bigint }>>`
        SELECT COUNT(DISTINCT mine."targetId")::bigint AS count
        FROM "ProfileReaction" mine
        JOIN "ProfileReaction" theirs ON theirs."actorId" = mine."targetId" AND theirs."targetId" = mine."actorId"
        WHERE mine."actorId" = ${userId}::uuid AND mine."action" IN ('LIKE', 'SUPER_LIKE') AND theirs."action" IN ('LIKE', 'SUPER_LIKE')
      `,
    ]);
    return { likes, matches: Number(matchedRows[0]?.count ?? 0), messages: null as number | null };
  }

  async getMatches(userId: string, options: { page?: number; pageSize?: number } = {}) {
    const { skip, take } = paginationWindow(options);
    const reactions = await this.prisma.profileReaction.findMany({
      where: { actorId: userId, action: { in: [ProfileReactionType.LIKE, ProfileReactionType.SUPER_LIKE] }, target: { reactionsSent: { some: { targetId: userId, action: { in: [ProfileReactionType.LIKE, ProfileReactionType.SUPER_LIKE] } } } } },
      select: { targetId: true },
      orderBy: { createdAt: 'desc' }, skip, take,
    });
    return this.getFeedForProfiles(userId, [...new Set(reactions.map(reaction => reaction.targetId))]);
  }

  async getSaved(userId: string, options: { page?: number; pageSize?: number } = {}) {
    const { skip, take } = paginationWindow(options);
    const rows = await this.prisma.savedProfile.findMany({ where: { ownerId: userId }, select: { targetId: true }, orderBy: { createdAt: 'desc' }, skip, take });
    const allowed: string[] = [];
    for (const row of rows) if (await this.visibility.canAccessProfile(userId, row.targetId)) allowed.push(row.targetId);
    return this.getFeedForProfiles(userId, allowed);
  }

  async replaceContacts(userId: string, contacts: string[]) {
    const digests = this.visibility.contactDigests(contacts);
    await this.prisma.$transaction(async tx => {
      await tx.profileContactHash.deleteMany({ where: { userId } });
      if (digests.length) await tx.profileContactHash.createMany({ data: digests.map(digest => ({ userId, digest })) });
    });
    return { stored: digests.length };
  }

  private async getFeedForProfiles(userId: string, ids: string[]) {
    const results: Awaited<ReturnType<DiscoveryService['getProfile']>>[] = [];
    for (const id of ids) {
      try { results.push(await this.getProfile(userId, id)); } catch { /* Privacy changes hide profiles immediately. */ }
    }
    return results;
  }

  private async getStoredPoint(table: 'ProfileGeoLocation' | 'DiscoverySearchPreference', userId: string): Promise<GeoPoint | null> {
    const rows = table === 'ProfileGeoLocation'
      ? await this.prisma.$queryRaw<Array<GeoPoint & { radiusKm: number }>>`SELECT ROUND(ST_Y("location"::geometry)::numeric, 2)::float8 AS latitude, ROUND(ST_X("location"::geometry)::numeric, 2)::float8 AS longitude, "areaLabel", "radiusKm" FROM "ProfileGeoLocation" WHERE "userId" = ${userId}::uuid AND "location" IS NOT NULL`
      : await this.prisma.$queryRaw<Array<GeoPoint & { radiusKm: number }>>`SELECT ROUND(ST_Y("location"::geometry)::numeric, 2)::float8 AS latitude, ROUND(ST_X("location"::geometry)::numeric, 2)::float8 AS longitude, "areaLabel", "radiusKm" FROM "DiscoverySearchPreference" WHERE "userId" = ${userId}::uuid AND "location" IS NOT NULL`;
    return rows[0] ?? null;
  }

  private async getViewerContactValues(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { email: true, mobileNumber: true } });
    return user ? [user.email, user.mobileNumber] : [];
  }

  private assertRadius(radius: number) {
    if (!ALLOWED_RADII.includes(radius)) throw new BadRequestException('Radius must be 5, 10, 25, 50 or 100 km.');
  }
}

function calculateAge(dateOfBirth: Date): number {
  const now = new Date();
  let age = now.getFullYear() - dateOfBirth.getFullYear();
  if (now.getMonth() < dateOfBirth.getMonth() || (now.getMonth() === dateOfBirth.getMonth() && now.getDate() < dateOfBirth.getDate())) age -= 1;
  return age;
}

function paginationWindow(options: { page?: number; pageSize?: number }) {
  const page = Math.max(0, Math.min(options.page ?? 0, 9));
  const take = Math.max(1, Math.min(options.pageSize ?? 30, 30));
  return { skip: page * take, take };
}
