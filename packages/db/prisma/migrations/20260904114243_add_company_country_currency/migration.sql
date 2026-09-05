-- AlterTable
ALTER TABLE "Company" ADD COLUMN     "country" TEXT,
ADD COLUMN     "defaultCurrency" TEXT NOT NULL DEFAULT 'USD';
