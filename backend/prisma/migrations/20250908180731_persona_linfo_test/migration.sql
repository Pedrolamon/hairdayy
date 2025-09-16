/*
  Warnings:

  - A unique constraint covering the columns `[userId]` on the table `PersonalInformation` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `updatedAt` to the `PersonalInformation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `PersonalInformation` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "PersonalInformation" ADD COLUMN     "availableDays" JSONB,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "endTime" TEXT,
ADD COLUMN     "paymentMethod" TEXT,
ADD COLUMN     "startTime" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "userId" TEXT NOT NULL,
ADD COLUMN     "workDays" INTEGER,
ALTER COLUMN "businessname" DROP NOT NULL,
ALTER COLUMN "daysworked" DROP NOT NULL,
ALTER COLUMN "menssage" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "PersonalInformation_userId_key" ON "PersonalInformation"("userId");

-- AddForeignKey
ALTER TABLE "PersonalInformation" ADD CONSTRAINT "PersonalInformation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
