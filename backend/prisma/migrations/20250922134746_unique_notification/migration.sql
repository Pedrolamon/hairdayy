/*
  Warnings:

  - A unique constraint covering the columns `[appointmentId]` on the table `PersonalInformation` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Appointment" ADD COLUMN     "notified" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "PersonalInformation" ADD COLUMN     "appointmentId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "PersonalInformation_appointmentId_key" ON "PersonalInformation"("appointmentId");
