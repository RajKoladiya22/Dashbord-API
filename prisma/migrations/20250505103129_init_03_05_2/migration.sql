/*
  Warnings:

  - You are about to drop the column `admin_custom_fields` on the `customers` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "customers" DROP COLUMN "admin_custom_fields",
ADD COLUMN     "adminCustomFields" JSONB;
