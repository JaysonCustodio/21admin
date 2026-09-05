-- CreateEnum
CREATE TYPE "ShiftSchedule" AS ENUM ('DAY_SHIFT', 'NIGHT_SHIFT', 'MID_SHIFT');

-- AlterTable
ALTER TABLE "Employee" ADD COLUMN     "shiftSchedule" "ShiftSchedule";

