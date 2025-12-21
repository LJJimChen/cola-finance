/*
  Warnings:

  - You are about to alter the column `percentage` on the `AllocationConfig` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(5,2)`.
  - You are about to alter the column `quantity` on the `AssetPosition` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(20,4)`.
  - You are about to alter the column `price` on the `AssetPosition` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(20,4)`.
  - You are about to alter the column `costPrice` on the `AssetPosition` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(20,4)`.
  - You are about to alter the column `marketValue` on the `AssetPosition` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(20,2)`.
  - You are about to alter the column `dayProfit` on the `AssetPosition` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(20,2)`.
  - You are about to drop the column `from` on the `CurrencyRate` table. All the data in the column will be lost.
  - You are about to drop the column `to` on the `CurrencyRate` table. All the data in the column will be lost.
  - You are about to alter the column `rate` on the `CurrencyRate` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(20,8)`.
  - You are about to alter the column `totalValue` on the `DailySnapshot` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(20,2)`.
  - You are about to alter the column `dayProfit` on the `DailySnapshot` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(20,2)`.
  - You are about to alter the column `totalProfit` on the `DailySnapshot` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(20,2)`.
  - The `status` column on the `DailySnapshot` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `status` column on the `PlatformAccount` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - A unique constraint covering the columns `[email]` on the table `AppUser` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[fromCurrency,toCurrency]` on the table `CurrencyRate` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `fromCurrency` to the `CurrencyRate` table without a default value. This is not possible if the table is not empty.
  - Added the required column `toCurrency` to the `CurrencyRate` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `date` on the `DailySnapshot` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "AccountStatus" AS ENUM ('Connected', 'Error', 'NeedVerify', 'Unauthorized');

-- CreateEnum
CREATE TYPE "SnapshotStatus" AS ENUM ('OK');

-- DropIndex
DROP INDEX "CurrencyRate_from_to_key";

-- AlterTable
ALTER TABLE "AllocationConfig" ALTER COLUMN "percentage" SET DATA TYPE DECIMAL(5,2);

-- AlterTable
ALTER TABLE "AppUser" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "note" TEXT;

-- AlterTable
ALTER TABLE "AssetPosition" ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'CNY',
ALTER COLUMN "quantity" SET DATA TYPE DECIMAL(20,4),
ALTER COLUMN "price" SET DATA TYPE DECIMAL(20,4),
ALTER COLUMN "costPrice" SET DATA TYPE DECIMAL(20,4),
ALTER COLUMN "marketValue" SET DATA TYPE DECIMAL(20,2),
ALTER COLUMN "dayProfit" SET DATA TYPE DECIMAL(20,2);

ALTER TABLE "CurrencyRate"
ADD COLUMN     "fromCurrency" TEXT,
ADD COLUMN     "toCurrency" TEXT,
ALTER COLUMN "rate" SET DATA TYPE DECIMAL(20,8);

UPDATE "CurrencyRate"
SET "fromCurrency" = "from",
    "toCurrency" = "to";

ALTER TABLE "CurrencyRate"
ALTER COLUMN "fromCurrency" SET NOT NULL,
ALTER COLUMN "toCurrency" SET NOT NULL,
DROP COLUMN "from",
DROP COLUMN "to";

ALTER TABLE "DailySnapshot"
ADD COLUMN     "baseCurrency" TEXT NOT NULL DEFAULT 'CNY',
ALTER COLUMN "date" TYPE DATE USING "date"::date,
ALTER COLUMN "totalValue" SET DATA TYPE DECIMAL(20,2),
ALTER COLUMN "dayProfit" SET DATA TYPE DECIMAL(20,2),
ALTER COLUMN "totalProfit" SET DATA TYPE DECIMAL(20,2),
DROP COLUMN "status",
ADD COLUMN     "status" "SnapshotStatus" NOT NULL DEFAULT 'OK';

-- AlterTable
ALTER TABLE "PlatformAccount" DROP COLUMN "status",
ADD COLUMN     "status" "AccountStatus" NOT NULL DEFAULT 'Connected';

-- CreateTable
CREATE TABLE "CategoryDefinition" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CategoryDefinition_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "CategoryDefinition_userId_name_key" ON "CategoryDefinition"("userId", "name");

CREATE INDEX IF NOT EXISTS "AllocationConfig_userId_idx" ON "AllocationConfig"("userId");

CREATE UNIQUE INDEX IF NOT EXISTS "AppUser_email_key" ON "AppUser"("email");

CREATE INDEX IF NOT EXISTS "AssetCategory_userId_category_idx" ON "AssetCategory"("userId", "category");

CREATE INDEX IF NOT EXISTS "AssetPosition_snapshotId_idx" ON "AssetPosition"("snapshotId");

CREATE INDEX IF NOT EXISTS "AssetPosition_accountId_idx" ON "AssetPosition"("accountId");

CREATE UNIQUE INDEX IF NOT EXISTS "CurrencyRate_fromCurrency_toCurrency_key" ON "CurrencyRate"("fromCurrency", "toCurrency");

CREATE INDEX IF NOT EXISTS "DailySnapshot_date_idx" ON "DailySnapshot"("date");

CREATE INDEX IF NOT EXISTS "DailySnapshot_userId_idx" ON "DailySnapshot"("userId");

CREATE UNIQUE INDEX IF NOT EXISTS "DailySnapshot_userId_date_key" ON "DailySnapshot"("userId", "date");

CREATE INDEX IF NOT EXISTS "FamilyGroup_creatorId_idx" ON "FamilyGroup"("creatorId");

CREATE INDEX IF NOT EXISTS "PlatformAccount_userId_idx" ON "PlatformAccount"("userId");

-- AddForeignKey
ALTER TABLE "FamilyGroup" ADD CONSTRAINT "FamilyGroup_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "AppUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CategoryDefinition" ADD CONSTRAINT "CategoryDefinition_userId_fkey" FOREIGN KEY ("userId") REFERENCES "AppUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
