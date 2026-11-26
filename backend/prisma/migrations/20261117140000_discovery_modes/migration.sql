CREATE TABLE "DiscoveryModeSelection" (
    "userId" UUID NOT NULL,
    "mode" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DiscoveryModeSelection_pkey" PRIMARY KEY ("userId", "mode"),
    CONSTRAINT "DiscoveryModeSelection_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "DiscoveryModeSelection_userId_idx" ON "DiscoveryModeSelection"("userId");
