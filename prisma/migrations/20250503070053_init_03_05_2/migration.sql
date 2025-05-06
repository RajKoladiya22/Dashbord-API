/*
  Warnings:

  - The `admin_custom_fields` column on the `customers` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "customers" DROP COLUMN "admin_custom_fields",
ADD COLUMN     "admin_custom_fields" TEXT[];
