/*
  Warnings:

  - Added the required column `address` to the `customers` table without a default value. This is not possible if the table is not empty.
  - Added the required column `joining_date` to the `customers` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "customer_product_history" ADD COLUMN     "status" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "customers" ADD COLUMN     "address" JSONB NOT NULL,
ADD COLUMN     "joining_date" TIMESTAMP(3) NOT NULL;
