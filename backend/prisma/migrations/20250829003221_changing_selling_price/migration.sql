/*
  Warnings:

  - You are about to drop the column `sellingPrice` on the `Product` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Product" DROP COLUMN "sellingPrice";

-- AlterTable
ALTER TABLE "Sale" ADD COLUMN     "sellingPrice" DOUBLE PRECISION;
