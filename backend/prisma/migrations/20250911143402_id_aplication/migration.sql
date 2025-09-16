/*
  Warnings:

  - A unique constraint covering the columns `[name,price,userId]` on the table `Product` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `barberId` to the `AppointmentService` table without a default value. This is not possible if the table is not empty.
  - Made the column `userId` on table `Product` required. This step will fail if there are existing NULL values in that column.
  - Made the column `userId` on table `Sale` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `barberId` to the `SaleProduct` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Product" DROP CONSTRAINT "Product_userId_fkey";

-- DropForeignKey
ALTER TABLE "Sale" DROP CONSTRAINT "Sale_userId_fkey";

-- DropIndex
DROP INDEX "Service_name_key";

-- AlterTable
ALTER TABLE "AppointmentService" ADD COLUMN     "barberId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Product" ALTER COLUMN "userId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Sale" ALTER COLUMN "userId" SET NOT NULL;

-- AlterTable
ALTER TABLE "SaleProduct" ADD COLUMN     "barberId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Product_name_price_userId_key" ON "Product"("name", "price", "userId");

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppointmentService" ADD CONSTRAINT "AppointmentService_barberId_fkey" FOREIGN KEY ("barberId") REFERENCES "Barber"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaleProduct" ADD CONSTRAINT "SaleProduct_barberId_fkey" FOREIGN KEY ("barberId") REFERENCES "Barber"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
