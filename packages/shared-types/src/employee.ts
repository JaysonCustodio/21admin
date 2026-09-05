import type { Currency } from "./currency";

export type EmploymentType = "FULL_TIME" | "PART_TIME" | "CONTRACT" | "INTERN";

export const EMPLOYEE_STATUSES = ["ACTIVE", "ON_LEAVE", "SUSPENDED", "TERMINATED"] as const;

export type EmployeeStatus = (typeof EMPLOYEE_STATUSES)[number];

export const SHIFT_SCHEDULES = ["DAY_SHIFT", "NIGHT_SHIFT", "MID_SHIFT"] as const;

export type ShiftSchedule = (typeof SHIFT_SCHEDULES)[number];

export interface Employee {
  id: string;
  companyId: string;
  employeeCode: string;
  fullName: string;
  profileImageUrl: string | null;
  email: string | null;
  companyEmail: string | null;
  phone: string | null;
  dateOfBirth: string | null;
  address: string | null;
  position: string | null;
  department: string | null;
  employmentType: EmploymentType | null;
  shiftSchedule: ShiftSchedule | null;
  hireDate: string | null;
  baseSalary: string | null;
  baseSalaryCurrency: Currency | null;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  bankName: string | null;
  bankAccountNumber: string | null;
  bankAccountHolderName: string | null;
  status: EmployeeStatus;
}

export interface EmployeeLookup {
  id: string;
  fullName: string;
  employeeCode: string;
  status: EmployeeStatus;
}
