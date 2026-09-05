-- CreateEnum
CREATE TYPE "AccountType" AS ENUM ('PERSONAL', 'BUSINESS');

-- AlterTable
ALTER TABLE "Company" ADD COLUMN     "accountType" "AccountType",
ADD COLUMN     "onboardingCompletedAt" TIMESTAMP(3);
