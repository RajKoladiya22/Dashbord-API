/*
  Warnings:

  - The `status` column on the `admins` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `status` column on the `login_credentials` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `status` column on the `partners` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `status` column on the `super_admins` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `status` column on the `team_members` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "admins" DROP COLUMN "status",
ADD COLUMN     "status" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "login_credentials" DROP COLUMN "status",
ADD COLUMN     "status" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "partners" DROP COLUMN "status",
ADD COLUMN     "status" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "super_admins" DROP COLUMN "status",
ADD COLUMN     "status" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "team_members" DROP COLUMN "status",
ADD COLUMN     "status" BOOLEAN NOT NULL DEFAULT true;
