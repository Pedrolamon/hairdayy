-- AlterTable
ALTER TABLE "Referral" ADD COLUMN     "activatedAt" TIMESTAMP(3),
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "deactivatedAt" TIMESTAMP(3),
ADD COLUMN     "payoutAmount" DECIMAL(10,2),
ADD COLUMN     "payoutPaid" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "active" SET DEFAULT false;

-- CreateTable
CREATE TABLE "ReferralPayout" (
    "id" TEXT NOT NULL,
    "referrerId" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paidAt" TIMESTAMP(3),
    "operatorId" TEXT,
    "note" TEXT,

    CONSTRAINT "ReferralPayout_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ReferralPayout" ADD CONSTRAINT "ReferralPayout_referrerId_fkey" FOREIGN KEY ("referrerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
