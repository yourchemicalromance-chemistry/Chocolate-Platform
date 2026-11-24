CREATE TABLE "DatingIntentSelection" (
    "userId" UUID NOT NULL,
    "intent" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DatingIntentSelection_pkey" PRIMARY KEY ("userId", "intent"),
    CONSTRAINT "DatingIntentSelection_intent_check" CHECK ("intent" IN ('serious', 'casual', 'flirting', 'exploring', 'marriage')),
    CONSTRAINT "DatingIntentSelection_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "DatingIntentSelection_userId_idx" ON "DatingIntentSelection"("userId");
