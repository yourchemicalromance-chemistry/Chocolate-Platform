-- Add durable reviewer decision notifications and enforce the reservation cap.
CREATE TYPE "VerificationNotificationStatus" AS ENUM ('PENDING', 'PROCESSING', 'SENT');

CREATE TABLE "VerificationNotification" (
  "id" UUID NOT NULL,
  "verificationId" UUID NOT NULL,
  "status" "VerificationNotificationStatus" NOT NULL DEFAULT 'PENDING',
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "nextAttemptAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "leaseExpiresAt" TIMESTAMP(3),
  "sentAt" TIMESTAMP(3),
  "lastErrorCode" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "VerificationNotification_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "VerificationNotification_verificationId_fkey" FOREIGN KEY ("verificationId")
    REFERENCES "HumanVerification"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "VerificationNotification_attempts_check" CHECK ("attempts" >= 0)
);
CREATE UNIQUE INDEX "VerificationNotification_verificationId_key"
  ON "VerificationNotification"("verificationId");
CREATE INDEX "VerificationNotification_status_nextAttemptAt_idx"
  ON "VerificationNotification"("status", "nextAttemptAt");

-- Committed reservations are left untouched. Any old incomplete reservation is
-- capped from its original creation time, so the release cannot inherit a 1h TTL.
UPDATE "MediaStorageReservation"
SET "expiresAt" = LEAST("expiresAt", "createdAt" + INTERVAL '180 seconds')
WHERE "status" IN ('ACTIVE', 'RECEIVING');
