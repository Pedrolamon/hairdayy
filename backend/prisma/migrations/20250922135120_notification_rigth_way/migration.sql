/*
  Warnings:

  - You are about to drop the column `appointmentId` on the `PersonalInformation` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[appointmentId]` on the table `Notification` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "PersonalInformation_appointmentId_key";

-- AlterTable
ALTER TABLE "Notification" ADD COLUMN     "appointmentId" TEXT;

-- AlterTable
ALTER TABLE "PersonalInformation" DROP COLUMN "appointmentId";

-- CreateIndex
CREATE UNIQUE INDEX "Notification_appointmentId_key" ON "Notification"("appointmentId");

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
