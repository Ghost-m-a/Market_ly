ALTER TABLE "User"
ADD COLUMN "creditsBalance" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "Campaign"
ADD COLUMN "targetViews" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "campaignCostCredits" INTEGER NOT NULL DEFAULT 0;

CREATE TABLE "CreditPricing" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "creditsPerThousandViews" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CreditPricing_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CreditLedger" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "campaignId" TEXT,
    "amount" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CreditLedger_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "CreditLedger_userId_createdAt_idx" ON "CreditLedger"("userId", "createdAt");
CREATE INDEX "CreditLedger_campaignId_idx" ON "CreditLedger"("campaignId");

ALTER TABLE "CreditLedger"
ADD CONSTRAINT "CreditLedger_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CreditLedger"
ADD CONSTRAINT "CreditLedger_campaignId_fkey"
FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE SET NULL ON UPDATE CASCADE;