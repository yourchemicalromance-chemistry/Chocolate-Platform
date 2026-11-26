import { createHmac } from 'node:crypto';
import { Injectable, OnModuleInit, ServiceUnavailableException } from '@nestjs/common';
import { parsePhoneNumberFromString, type CountryCode } from 'libphonenumber-js';
import { PrismaService } from '../prisma/prisma.service.js';

const AREA_EXCLUSION_METERS = 5_000;
const NEIGHBOURHOOD_METERS = 3_000;

@Injectable()
export class DiscoveryPrivacyService implements OnModuleInit {
  constructor(private readonly prisma: PrismaService) {}

  onModuleInit() { validateContactLockSecret(process.env.CONTACT_LOCK_HMAC_SECRET); }

  contactDigests(values: Array<string | null | undefined>): string[] {
    const secret = validateContactLockSecret(process.env.CONTACT_LOCK_HMAC_SECRET);
    const normalized = values.flatMap(value => normalizeContactVariants(value));
    return [...new Set(normalized.map(value => createHmac('sha256', secret).update(value).digest('hex')))];
  }

  async canAccessProfile(viewerId: string, targetId: string): Promise<boolean> {
    if (viewerId === targetId) return true;
    const [viewer, target] = await Promise.all([
      this.prisma.profile.findUnique({ where: { userId: viewerId }, include: {
        interestedIn: true, owner: { select: { accountStatus: true, dateOfBirth: true, email: true, mobileNumber: true } },
      } }),
      this.prisma.profile.findUnique({ where: { userId: targetId }, include: {
        interestedIn: true,
        owner: { select: { accountStatus: true, dateOfBirth: true, humanVerifications: {
          where: { status: 'VERIFIED', mediaAssetType: 'AGE_INTERVIEW_VIDEO', mediaProcessingStatus: 'READY' }, select: { id: true },
        } } },
        photos: { where: { asset: { type: 'PROFILE_PHOTO', processingStatus: 'READY' } }, select: { id: true }, take: 1 },
      } }),
    ]);
    if (!viewer?.completedAt || viewer.owner.accountStatus !== 'ACTIVE' || !isAdult(viewer.owner.dateOfBirth) || !target?.completedAt ||
      target.owner.accountStatus !== 'ACTIVE' || !isAdult(target.owner.dateOfBirth) ||
      !target.owner.humanVerifications.length || !target.photos.length || !target.displayName ||
      !areMeetingPreferencesCompatible(viewer.interestedIn.map(row => row.value), viewer.genderIdentity,
        target.interestedIn.map(row => row.value), target.genderIdentity)) return false;
    const [rows] = await this.prisma.$queryRaw<Array<{ allowed: boolean }>>`
      SELECT (
        u."accountStatus" = 'ACTIVE'
        AND p."completedAt" IS NOT NULL
        AND EXISTS (SELECT 1 FROM "HumanVerification" hv WHERE hv."userId" = u."id" AND hv."status" = 'VERIFIED' AND hv."mediaAssetType" = 'AGE_INTERVIEW_VIDEO' AND hv."mediaProcessingStatus" = 'READY')
        AND EXISTS (SELECT 1 FROM "ProfilePhoto" pp JOIN "MediaAsset" ma ON ma."id" = pp."assetId" WHERE pp."userId" = u."id" AND ma."type" = 'PROFILE_PHOTO' AND ma."processingStatus" = 'READY')
        AND NOT COALESCE(ps."undiscoverableEnabled", false)
        AND NOT (
          COALESCE(ps."contactLockEnabled", false)
          AND EXISTS (SELECT 1 FROM "ProfileContactHash" ch WHERE ch."userId" = u."id" AND ch."digest" = ANY(${this.contactDigests([viewer.owner.email, viewer.owner.mobileNumber])}::text[]))
        )
        AND NOT (
          COALESCE(ps."areaExclusionEnabled", false)
          AND (ps."excludedLocation" IS NULL OR (viewer_loc."location" IS NULL AND search_loc."location" IS NULL) OR
            (viewer_loc."location" IS NOT NULL AND ST_DWithin(ps."excludedLocation", viewer_loc."location", ${AREA_EXCLUSION_METERS})) OR
            (search_loc."location" IS NOT NULL AND ST_DWithin(ps."excludedLocation", search_loc."location", ${AREA_EXCLUSION_METERS})))
        )
        AND NOT (
          COALESCE(ps."neighbourhoodLockEnabled", false)
          AND (viewer_loc."location" IS NULL OR target_loc."location" IS NULL OR ST_DWithin(viewer_loc."location", target_loc."location", ${NEIGHBOURHOOD_METERS}))
        )
        AND NOT (
          COALESCE(viewer_privacy."areaExclusionEnabled", false)
          AND (viewer_privacy."excludedLocation" IS NULL OR target_loc."location" IS NULL
            OR ST_DWithin(viewer_privacy."excludedLocation", target_loc."location", ${AREA_EXCLUSION_METERS}))
        )
        AND NOT (
          COALESCE(viewer_privacy."neighbourhoodLockEnabled", false)
          AND (viewer_loc."location" IS NULL OR target_loc."location" IS NULL
            OR ST_DWithin(viewer_loc."location", target_loc."location", ${NEIGHBOURHOOD_METERS}))
        )
      ) AS allowed
      FROM "User" u
      JOIN "Profile" p ON p."userId" = u."id"
      LEFT JOIN "ProfilePrivacySetting" ps ON ps."userId" = u."id"
      LEFT JOIN "ProfilePrivacySetting" viewer_privacy ON viewer_privacy."userId" = ${viewerId}::uuid
      LEFT JOIN "ProfileGeoLocation" target_loc ON target_loc."userId" = u."id"
      LEFT JOIN LATERAL (
        SELECT ST_SetSRID(ST_MakePoint(ROUND(ST_X(gl."location"::geometry)::numeric, 2)::float8, ROUND(ST_Y(gl."location"::geometry)::numeric, 2)::float8), 4326)::geography AS "location"
        FROM "ProfileGeoLocation" gl WHERE gl."userId" = ${viewerId}::uuid AND gl."location" IS NOT NULL
      ) viewer_loc ON TRUE
      LEFT JOIN LATERAL (
        SELECT ST_SetSRID(ST_MakePoint(ROUND(ST_X(sp."location"::geometry)::numeric, 2)::float8, ROUND(ST_Y(sp."location"::geometry)::numeric, 2)::float8), 4326)::geography AS "location"
        FROM "DiscoverySearchPreference" sp WHERE sp."userId" = ${viewerId}::uuid AND sp."location" IS NOT NULL
      ) search_loc ON TRUE
      WHERE u."id" = ${targetId}::uuid
    `;
    return rows?.allowed === true;
  }

  static get areaExclusionMeters() { return AREA_EXCLUSION_METERS; }
  static get neighbourhoodMeters() { return NEIGHBOURHOOD_METERS; }
}

export function normalizeContact(raw: string | null | undefined): string {
  if (!raw) return '';
  const trimmed = raw.trim();
  if (!trimmed) return '';
  if (trimmed.includes('@')) return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed) ? `email:${trimmed.toLowerCase()}` : '';
  const tagged = /^phone\[([a-z]{2})\]:(.+)$/i.exec(trimmed);
  const region = (tagged?.[1]?.toUpperCase() ?? 'IN') as CountryCode;
  const phoneValue = (tagged?.[2] ?? trimmed).trim();
  const parsed = parsePhoneNumberFromString(phoneValue, region);
  return parsed?.isValid() ? `phone:${parsed.number}` : '';
}

function normalizeContactVariants(raw: string | null | undefined): string[] {
  const canonical = normalizeContact(raw);
  if (!canonical) return [];
  if (canonical.startsWith('email:')) return [canonical];
  const tagged = /^phone\[([a-z]{2})\]:(.+)$/i.exec(raw!.trim());
  const rawPhone = (tagged?.[2] ?? raw!).trim();
  const parsed = parsePhoneNumberFromString(rawPhone, (tagged?.[1]?.toUpperCase() ?? 'IN') as CountryCode);
  const legacyDigits = rawPhone.replace(/[^\d+]/g, '');
  const aliases = [canonical, `phone:${legacyDigits}`];
  if (parsed?.isValid()) {
    const nationalDigits = parsed.formatNational().replace(/\D/g, '');
    aliases.push(`phone:${nationalDigits}`, `phone:${parsed.nationalNumber}`);
  }
  return [...new Set(aliases)];
}

export function validateContactLockSecret(secret: string | undefined): string {
  const weakPattern = /(replace[-_ ]?with|placeholder|example|change[-_ ]?me|your[-_ ]?secret|\b(?:development|insecure|sample|dummy)\b|^(?:test|dev|secret|password)[-_ ])/i;
  if (!secret || Buffer.byteLength(secret, 'utf8') < 32 || new Set(secret).size < 12 || weakPattern.test(secret)) {
    throw new ServiceUnavailableException('Contact Lock is not configured with a strong server secret.');
  }
  return secret;
}

export function areMeetingPreferencesCompatible(viewerPreferences: string[], viewerGender: string | null, targetPreferences: string[], targetGender: string | null): boolean {
  return preferenceMatches(viewerPreferences, targetGender) && preferenceMatches(targetPreferences, viewerGender);
}

function preferenceMatches(preferences: string[], identity: string | null): boolean {
  if (!preferences.length || preferences.includes('Prefer not to say')) return false;
  if (preferences.includes('Everyone')) return true;
  if (!identity) return false;
  const category = identity === 'Woman' ? 'Women' : identity === 'Man' ? 'Men' : 'Non-binary People';
  return preferences.includes(category);
}

export function isAdult(dateOfBirth: Date): boolean {
  const now = new Date();
  let age = now.getFullYear() - dateOfBirth.getFullYear();
  if (now.getMonth() < dateOfBirth.getMonth() || (now.getMonth() === dateOfBirth.getMonth() && now.getDate() < dateOfBirth.getDate())) age -= 1;
  return age >= 18;
}
