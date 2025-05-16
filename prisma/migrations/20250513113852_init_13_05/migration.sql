-- CreateEnum
CREATE TYPE "renewPeriod" AS ENUM ('monthly', 'quarterly', 'yearly', 'half_yearly', 'custom');

-- AlterTable
ALTER TABLE "customer_product_history" ADD COLUMN     "renewPeriod" "renewPeriod" NOT NULL DEFAULT 'custom';
