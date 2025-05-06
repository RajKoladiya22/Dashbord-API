/*
  Warnings:

  - You are about to drop the column `reference_detail` on the `customers` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "customers" DROP COLUMN "reference_detail",
ADD COLUMN     "partner_id" UUID;

-- AddForeignKey
ALTER TABLE "customers" ADD CONSTRAINT "customers_partner_id_fkey" FOREIGN KEY ("partner_id") REFERENCES "partners"("id") ON DELETE SET NULL ON UPDATE CASCADE;
