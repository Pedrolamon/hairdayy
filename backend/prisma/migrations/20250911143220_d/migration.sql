/*
  Warnings:

  - You are about to drop the column `barberId` on the `AppointmentService` table. All the data in the column will be lost.
  - You are about to drop the column `barberId` on the `SaleProduct` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[name]` on the table `Service` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "AppointmentService" DROP CONSTRAINT "AppointmentService_barberId_fkey";

-- DropForeignKey
ALTER TABLE "Product" DROP CONSTRAINT "Product_userId_fkey";

-- DropForeignKey
ALTER TABLE "Sale" DROP CONSTRAINT "Sale_userId_fkey";

-- DropForeignKey
ALTER TABLE "SaleProduct" DROP CONSTRAINT "SaleProduct_barberId_fkey";

-- DropIndex
DROP INDEX "Product_name_price_userId_key";

-- AlterTable
ALTER TABLE "AppointmentService" DROP COLUMN "barberId";

-- AlterTable
ALTER TABLE "Product" ALTER COLUMN "userId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Sale" ALTER COLUMN "userId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "SaleProduct" DROP COLUMN "barberId";

-- CreateIndex
CREATE UNIQUE INDEX "Service_name_key" ON "Service"("name");

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
