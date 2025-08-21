-- CreateEnum
CREATE TYPE "ReminderChannel" AS ENUM ('NONE', 'EMAIL', 'WHATSAPP', 'BOTH');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "reminderChannel" "ReminderChannel" NOT NULL DEFAULT 'BOTH';
