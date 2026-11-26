CREATE TABLE "Profile" (
  "userId" UUID NOT NULL,
  "displayName" VARCHAR(30),
  "genderIdentity" TEXT,
  "bio" VARCHAR(300),
  "selectedPrompt" TEXT,
  "completedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Profile_pkey" PRIMARY KEY ("userId"),
  CONSTRAINT "Profile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "ProfileMeetingPreference" ("userId" UUID NOT NULL, "value" TEXT NOT NULL, CONSTRAINT "ProfileMeetingPreference_pkey" PRIMARY KEY ("userId", "value"), CONSTRAINT "ProfileMeetingPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Profile"("userId") ON DELETE CASCADE ON UPDATE CASCADE);
CREATE TABLE "ProfileLanguage" ("userId" UUID NOT NULL, "value" TEXT NOT NULL, CONSTRAINT "ProfileLanguage_pkey" PRIMARY KEY ("userId", "value"), CONSTRAINT "ProfileLanguage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Profile"("userId") ON DELETE CASCADE ON UPDATE CASCADE);
CREATE TABLE "ProfileInterest" ("userId" UUID NOT NULL, "value" TEXT NOT NULL, CONSTRAINT "ProfileInterest_pkey" PRIMARY KEY ("userId", "value"), CONSTRAINT "ProfileInterest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Profile"("userId") ON DELETE CASCADE ON UPDATE CASCADE);
CREATE TABLE "ProfileLifestyle" ("userId" UUID NOT NULL, "value" TEXT NOT NULL, CONSTRAINT "ProfileLifestyle_pkey" PRIMARY KEY ("userId", "value"), CONSTRAINT "ProfileLifestyle_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Profile"("userId") ON DELETE CASCADE ON UPDATE CASCADE);
CREATE TABLE "ProfileValue" ("userId" UUID NOT NULL, "value" TEXT NOT NULL, CONSTRAINT "ProfileValue_pkey" PRIMARY KEY ("userId", "value"), CONSTRAINT "ProfileValue_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Profile"("userId") ON DELETE CASCADE ON UPDATE CASCADE);
CREATE TABLE "ProfileConversationStyle" ("userId" UUID NOT NULL, "value" TEXT NOT NULL, CONSTRAINT "ProfileConversationStyle_pkey" PRIMARY KEY ("userId", "value"), CONSTRAINT "ProfileConversationStyle_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Profile"("userId") ON DELETE CASCADE ON UPDATE CASCADE);
CREATE TABLE "ProfilePhoto" (
  "id" UUID NOT NULL,
  "userId" UUID NOT NULL,
  "assetId" UUID NOT NULL,
  "position" INTEGER NOT NULL,
  "isMain" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ProfilePhoto_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ProfilePhoto_userId_fkey" FOREIGN KEY ("userId") REFERENCES "Profile"("userId") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "ProfilePhoto_assetId_userId_fkey" FOREIGN KEY ("assetId", "userId") REFERENCES "MediaAsset"("id", "userId") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "ProfilePhoto_assetId_key" ON "ProfilePhoto"("assetId");
CREATE UNIQUE INDEX "ProfilePhoto_userId_position_key" ON "ProfilePhoto"("userId", "position");
CREATE UNIQUE INDEX "ProfilePhoto_assetId_userId_key" ON "ProfilePhoto"("assetId", "userId");
CREATE INDEX "ProfilePhoto_userId_isMain_idx" ON "ProfilePhoto"("userId", "isMain");
CREATE INDEX "ProfileMeetingPreference_userId_idx" ON "ProfileMeetingPreference"("userId");
CREATE INDEX "ProfileLanguage_userId_idx" ON "ProfileLanguage"("userId");
CREATE INDEX "ProfileInterest_userId_idx" ON "ProfileInterest"("userId");
CREATE INDEX "ProfileLifestyle_userId_idx" ON "ProfileLifestyle"("userId");
CREATE INDEX "ProfileValue_userId_idx" ON "ProfileValue"("userId");
CREATE INDEX "ProfileConversationStyle_userId_idx" ON "ProfileConversationStyle"("userId");
