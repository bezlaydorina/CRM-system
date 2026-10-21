-- CreateTable
CREATE TABLE "Referral" (
    "id" TEXT NOT NULL,
    "referrerAccountId" TEXT NOT NULL,
    "referredAccountId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "rewardedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Referral_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Referral_referredAccountId_key" ON "Referral"("referredAccountId");

-- AddForeignKey
ALTER TABLE "Referral" ADD CONSTRAINT "Referral_referrerAccountId_fkey" FOREIGN KEY ("referrerAccountId") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Referral" ADD CONSTRAINT "Referral_referredAccountId_fkey" FOREIGN KEY ("referredAccountId") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
