/*
  Warnings:

  - You are about to drop the column `barberId` on the `AppointmentService` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `FinancialRecord` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `Sale` table. All the data in the column will be lost.
  - You are about to drop the column `barberId` on the `SaleProduct` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `Service` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[name]` on the table `Service` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "AppointmentService" DROP CONSTRAINT "AppointmentService_barberId_fkey";

-- DropForeignKey
ALTER TABLE "FinancialRecord" DROP CONSTRAINT "FinancialRecord_userId_fkey";

-- DropForeignKey
ALTER TABLE "Product" DROP CONSTRAINT "Product_userId_fkey";

-- DropForeignKey
ALTER TABLE "Sale" DROP CONSTRAINT "Sale_userId_fkey";

-- DropForeignKey
ALTER TABLE "SaleProduct" DROP CONSTRAINT "SaleProduct_barberId_fkey";

-- DropForeignKey
ALTER TABLE "Service" DROP CONSTRAINT "Service_userId_fkey";

-- DropIndex
DROP INDEX "Product_name_price_userId_key";

-- DropIndex
DROP INDEX "Service_name_price_duration_userId_key";

-- AlterTable
ALTER TABLE "AppointmentService" DROP COLUMN "barberId";

-- AlterTable
ALTER TABLE "FinancialRecord" DROP COLUMN "userId";

-- AlterTable
ALTER TABLE "Product" DROP COLUMN "userId";

-- AlterTable
ALTER TABLE "Sale" DROP COLUMN "userId";

-- AlterTable
ALTER TABLE "SaleProduct" DROP COLUMN "barberId";

-- AlterTable
ALTER TABLE "Service" DROP COLUMN "userId";

-- CreateIndex
CREATE UNIQUE INDEX "Service_name_key" ON "Service"("name");
