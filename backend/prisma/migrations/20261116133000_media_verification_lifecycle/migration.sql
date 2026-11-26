-- Additive media, human-verification, storage-quota and deletion lifecycle.
-- This migration has not been applied to Aiven.

CREATE TYPE "AccountStatus" AS ENUM ('ACTIVE', 'PENDING_DELETION');
CREATE TYPE "MediaType" AS ENUM ('PROFILE_PHOTO', 'AGE_INTERVIEW_VIDEO');
CREATE TYPE "MediaProcessingStatus" AS ENUM ('UPLOADING', 'PROCESSING', 'READY', 'FAILED', 'DELETING');
CREATE TYPE "VerificationSessionStatus" AS ENUM ('OPEN', 'CONSUMED', 'EXPIRED');
CREATE TYPE "HumanVerificationStatus" AS ENUM ('PENDING', 'VERIFIED', 'FAILED', 'MANUAL_REVIEW');
CREATE TYPE "MediaReservationStatus" AS ENUM ('ACTIVE', 'COMMITTED', 'RELEASED');
CREATE TYPE "MediaDeletionStatus" AS ENUM ('PENDING', 'PROCESSING', 'RETRY', 'COMPLETED');

ALTER TABLE "User"
  ADD COLUMN "accountStatus" "AccountStatus" NOT NULL DEFAULT 'ACTIVE',
  ADD COLUMN "deletionRequestedAt" TIMESTAMP(3),
  ADD COLUMN "deletionScheduledAt" TIMESTAMP(3);

CREATE TABLE "MediaStorageQuota" (
  "id" INTEGER NOT NULL DEFAULT 1,
  "maxBytes" BIGINT NOT NULL,
  "usedBytes" BIGINT NOT NULL DEFAULT 0,
  "reservedBytes" BIGINT NOT NULL DEFAULT 0,
  "activeProcessingJobs" INTEGER NOT NULL DEFAULT 0,
  "maxConcurrentProcessingJobs" INTEGER NOT NULL DEFAULT 1,
  CONSTRAINT "MediaStorageQuota_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "MediaStorageQuota_counters_check" CHECK (
    "maxBytes" > 0 AND "usedBytes" >= 0 AND "reservedBytes" >= 0 AND
    "usedBytes" + "reservedBytes" <= "maxBytes" AND
    "activeProcessingJobs" >= 0 AND "maxConcurrentProcessingJobs" > 0 AND
    "activeProcessingJobs" <= "maxConcurrentProcessingJobs"
  ),
  CONSTRAINT "MediaStorageQuota_id_singleton_check" CHECK ("id" = 1)
);

INSERT INTO "MediaStorageQuota" ("id", "maxBytes", "usedBytes", "reservedBytes")
VALUES (1, 15000000000, 0, 0);

CREATE TABLE "MediaStorageReservation" (
  "id" UUID NOT NULL,
  "userId" UUID NOT NULL,
  "mediaType" "MediaType" NOT NULL,
  "reservedBytes" BIGINT NOT NULL,
  "status" "MediaReservationStatus" NOT NULL DEFAULT 'ACTIVE',
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "MediaStorageReservation_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "MediaStorageReservation_userId_fkey" FOREIGN KEY ("userId")
    REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX "MediaStorageReservation_status_expiresAt_idx"
  ON "MediaStorageReservation"("status", "expiresAt");
CREATE INDEX "MediaStorageReservation_userId_createdAt_idx"
  ON "MediaStorageReservation"("userId", "createdAt");

CREATE TABLE "MediaAsset" (
  "id" UUID NOT NULL,
  "userId" UUID NOT NULL,
  "type" "MediaType" NOT NULL,
  "processingStatus" "MediaProcessingStatus" NOT NULL DEFAULT 'UPLOADING',
  "processingSlotAcquired" BOOLEAN NOT NULL DEFAULT false,
  "storageKey" TEXT NOT NULL,
  "originalSizeBytes" BIGINT NOT NULL,
  "storedSizeBytes" BIGINT,
  "mimeType" TEXT NOT NULL,
  "format" TEXT,
  "width" INTEGER,
  "height" INTEGER,
  "durationSeconds" DOUBLE PRECISION,
  "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "reservationId" UUID,
  "thumbnailStorageKey" TEXT,
  CONSTRAINT "MediaAsset_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "MediaAsset_userId_fkey" FOREIGN KEY ("userId")
    REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "MediaAsset_reservationId_fkey" FOREIGN KEY ("reservationId")
    REFERENCES "MediaStorageReservation"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "MediaAsset_bytes_nonnegative_check" CHECK (
    "originalSizeBytes" >= 0 AND ("storedSizeBytes" IS NULL OR "storedSizeBytes" >= 0)
  ),
  CONSTRAINT "MediaAsset_dimensions_positive_check" CHECK (
    ("width" IS NULL OR "width" > 0) AND ("height" IS NULL OR "height" > 0)
  ),
  CONSTRAINT "MediaAsset_duration_positive_check" CHECK (
    "durationSeconds" IS NULL OR "durationSeconds" > 0
  )
);
CREATE UNIQUE INDEX "MediaAsset_storageKey_key" ON "MediaAsset"("storageKey");
CREATE UNIQUE INDEX "MediaAsset_reservationId_key" ON "MediaAsset"("reservationId");
CREATE UNIQUE INDEX "MediaAsset_id_type_processingStatus_key"
  ON "MediaAsset"("id", "type", "processingStatus");
CREATE UNIQUE INDEX "MediaAsset_id_userId_key" ON "MediaAsset"("id", "userId");
CREATE UNIQUE INDEX "MediaAsset_id_userId_type_key" ON "MediaAsset"("id", "userId", "type");
CREATE INDEX "MediaAsset_userId_type_processingStatus_idx"
  ON "MediaAsset"("userId", "type", "processingStatus");

CREATE TABLE "VerificationSession" (
  "id" UUID NOT NULL,
  "userId" UUID NOT NULL,
  "challengeTokenHash" TEXT NOT NULL,
  "challengeInstructions" JSONB NOT NULL,
  "status" "VerificationSessionStatus" NOT NULL DEFAULT 'OPEN',
  "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "consumedAt" TIMESTAMP(3),
  "mediaAssetId" UUID,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "VerificationSession_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "VerificationSession_userId_fkey" FOREIGN KEY ("userId")
    REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "VerificationSession_mediaAssetId_userId_fkey" FOREIGN KEY ("mediaAssetId", "userId")
    REFERENCES "MediaAsset"("id", "userId") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "VerificationSession_challengeTokenHash_key"
  ON "VerificationSession"("challengeTokenHash");
CREATE UNIQUE INDEX "VerificationSession_mediaAssetId_key"
  ON "VerificationSession"("mediaAssetId");
CREATE INDEX "VerificationSession_userId_status_expiresAt_idx"
  ON "VerificationSession"("userId", "status", "expiresAt");
CREATE UNIQUE INDEX "VerificationSession_id_userId_key"
  ON "VerificationSession"("id", "userId");
CREATE UNIQUE INDEX "VerificationSession_mediaAssetId_userId_key"
  ON "VerificationSession"("mediaAssetId", "userId");

CREATE TABLE "HumanVerification" (
  "id" UUID NOT NULL,
  "userId" UUID NOT NULL,
  "mediaAssetId" UUID,
  "mediaAssetType" "MediaType",
  "mediaProcessingStatus" "MediaProcessingStatus",
  "sessionId" UUID NOT NULL,
  "status" "HumanVerificationStatus" NOT NULL DEFAULT 'PENDING',
  "provider" TEXT NOT NULL DEFAULT 'builtin-exact-replay-check',
  "contentSha256" TEXT NOT NULL,
  "checks" JSONB NOT NULL,
  "reviewerUserId" UUID,
  "reviewedAt" TIMESTAMP(3),
  "decisionReason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "HumanVerification_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "HumanVerification_userId_fkey" FOREIGN KEY ("userId")
    REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "HumanVerification_mediaAsset_fkey" FOREIGN KEY (
    "mediaAssetId", "userId", "mediaAssetType"
  ) REFERENCES "MediaAsset"("id", "userId", "type")
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "HumanVerification_sessionId_userId_fkey" FOREIGN KEY ("sessionId", "userId")
    REFERENCES "VerificationSession"("id", "userId") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "HumanVerification_reviewerUserId_fkey" FOREIGN KEY ("reviewerUserId")
    REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "HumanVerification_video_asset_only_check" CHECK (
    "mediaAssetId" IS NULL OR (
      "mediaAssetType" = 'AGE_INTERVIEW_VIDEO' AND "mediaProcessingStatus" = 'READY'
    )
  )
);
CREATE UNIQUE INDEX "HumanVerification_mediaAssetId_key" ON "HumanVerification"("mediaAssetId");
CREATE UNIQUE INDEX "HumanVerification_sessionId_key" ON "HumanVerification"("sessionId");
CREATE UNIQUE INDEX "HumanVerification_sessionId_userId_key"
  ON "HumanVerification"("sessionId", "userId");
CREATE UNIQUE INDEX "HumanVerification_mediaAsset_userId_mediaType_key"
  ON "HumanVerification"("mediaAssetId", "userId", "mediaAssetType");
CREATE INDEX "HumanVerification_status_createdAt_idx"
  ON "HumanVerification"("status", "createdAt");
CREATE INDEX "HumanVerification_userId_status_idx"
  ON "HumanVerification"("userId", "status");
CREATE INDEX "HumanVerification_contentSha256_idx"
  ON "HumanVerification"("contentSha256");

CREATE TABLE "MediaDeletionJob" (
  "id" UUID NOT NULL,
  "userId" UUID NOT NULL,
  "status" "MediaDeletionStatus" NOT NULL DEFAULT 'PENDING',
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "nextAttemptAt" TIMESTAMP(3) NOT NULL,
  "leaseExpiresAt" TIMESTAMP(3),
  "lastErrorCode" TEXT,
  "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "MediaDeletionJob_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "MediaDeletionJob_userId_fkey" FOREIGN KEY ("userId")
    REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "MediaDeletionJob_attempts_nonnegative_check" CHECK ("attempts" >= 0)
);
CREATE INDEX "MediaDeletionJob_status_nextAttemptAt_idx"
  ON "MediaDeletionJob"("status", "nextAttemptAt");
CREATE UNIQUE INDEX "MediaDeletionJob_userId_key" ON "MediaDeletionJob"("userId");
CREATE INDEX "MediaDeletionJob_userId_status_idx"
  ON "MediaDeletionJob"("userId", "status");
