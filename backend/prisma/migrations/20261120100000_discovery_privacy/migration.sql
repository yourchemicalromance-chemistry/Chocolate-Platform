-- Aiven supports PostGIS on supported PostgreSQL service versions. This migration
-- is intentionally additive and must be reviewed/applied by the database owner.
CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TYPE "ProfileReactionType" AS ENUM ('LIKE', 'SUPER_LIKE', 'PASS', 'VIEW');

CREATE TABLE "ProfileGeoLocation" (
  "userId" UUID NOT NULL,
  "location" geography(Point, 4326),
  "areaLabel" VARCHAR(120),
  "radiusKm" INTEGER NOT NULL DEFAULT 25,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ProfileGeoLocation_radiusKm_check" CHECK ("radiusKm" IN (5, 10, 25, 50, 100)),
  CONSTRAINT "ProfileGeoLocation_pkey" PRIMARY KEY ("userId"),
  CONSTRAINT "ProfileGeoLocation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "ProfileGeoLocation_location_gix" ON "ProfileGeoLocation" USING GIST ("location");

CREATE TABLE "ProfilePrivacySetting" (
  "userId" UUID NOT NULL,
  "contactLockEnabled" BOOLEAN NOT NULL DEFAULT false,
  "neighbourhoodLockEnabled" BOOLEAN NOT NULL DEFAULT false,
  "areaExclusionEnabled" BOOLEAN NOT NULL DEFAULT false,
  "undiscoverableEnabled" BOOLEAN NOT NULL DEFAULT false,
  "excludedArea" VARCHAR(120),
  "excludedLocation" geography(Point, 4326),
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ProfilePrivacySetting_pkey" PRIMARY KEY ("userId"),
  CONSTRAINT "ProfilePrivacySetting_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "ProfilePrivacySetting_excludedLocation_gix" ON "ProfilePrivacySetting" USING GIST ("excludedLocation");

CREATE TABLE "ProfileContactHash" (
  "userId" UUID NOT NULL,
  "digest" CHAR(64) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ProfileContactHash_pkey" PRIMARY KEY ("userId", "digest"),
  CONSTRAINT "ProfileContactHash_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "ProfileContactHash_digest_idx" ON "ProfileContactHash"("digest");

CREATE TABLE "DiscoverySearchPreference" (
  "userId" UUID NOT NULL,
  "location" geography(Point, 4326),
  "areaLabel" VARCHAR(120),
  "radiusKm" INTEGER NOT NULL DEFAULT 50,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "DiscoverySearchPreference_pkey" PRIMARY KEY ("userId"),
  CONSTRAINT "DiscoverySearchPreference_radiusKm_check" CHECK ("radiusKm" IN (5, 10, 25, 50, 100)),
  CONSTRAINT "DiscoverySearchPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "DiscoverySearchPreference_location_gix" ON "DiscoverySearchPreference" USING GIST ("location");

CREATE TABLE "ProfileReaction" (
  "id" UUID NOT NULL,
  "actorId" UUID NOT NULL,
  "targetId" UUID NOT NULL,
  "action" "ProfileReactionType" NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ProfileReaction_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ProfileReaction_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "ProfileReaction_targetId_fkey" FOREIGN KEY ("targetId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "ProfileReaction_actorId_targetId_action_key" UNIQUE ("actorId", "targetId", "action")
);
CREATE INDEX "ProfileReaction_targetId_action_createdAt_idx" ON "ProfileReaction"("targetId", "action", "createdAt");

CREATE TABLE "SavedProfile" (
  "ownerId" UUID NOT NULL,
  "targetId" UUID NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SavedProfile_pkey" PRIMARY KEY ("ownerId", "targetId"),
  CONSTRAINT "SavedProfile_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "SavedProfile_targetId_fkey" FOREIGN KEY ("targetId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "SavedProfile_targetId_idx" ON "SavedProfile"("targetId");
