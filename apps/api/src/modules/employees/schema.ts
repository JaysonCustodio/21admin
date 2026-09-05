import { z } from "zod";
import { CURRENCIES, EMPLOYEE_STATUSES, SHIFT_SCHEDULES } from "@business-platform/shared-types";

export const createEmployeeSchema = z.object({
  employeeCode: z.string().min(1).optional(),
  fullName: z.string().min(1),
  email: z.string().email().optional(),
  companyEmail: z.string().email().optional(),
  phone: z.string().min(1).optional(),
  dateOfBirth: z.string().datetime().optional(),
  address: z.string().min(1).optional(),
  position: z.string().min(1).optional(),
  department: z.string().min(1).optional(),
  employmentType: z.enum(["FULL_TIME", "PART_TIME", "CONTRACT", "INTERN"]).optional(),
  shiftSchedule: z.enum(SHIFT_SCHEDULES).optional(),
  hireDate: z.string().datetime().optional(),
  baseSalary: z.number().nonnegative().optional(),
  baseSalaryCurrency: z.enum(CURRENCIES).optional(),
  emergencyContactName: z.string().min(1).optional(),
  emergencyContactPhone: z.string().min(1).optional(),
  bankName: z.string().min(1).optional(),
  bankAccountNumber: z.string().min(1).optional(),
  bankAccountHolderName: z.string().min(1).optional(),
});

export type CreateEmployeeInput = z.infer<typeof createEmployeeSchema>;

// update fields are nullable (send null to clear) and optional (omit to leave untouched)
export const updateEmployeeSchema = z.object({
  employeeCode: z.string().min(1).optional(),
  fullName: z.string().min(1).optional(),
  email: z.string().email().nullable().optional(),
  companyEmail: z.string().email().nullable().optional(),
  phone: z.string().min(1).nullable().optional(),
  dateOfBirth: z.string().datetime().nullable().optional(),
  address: z.string().min(1).nullable().optional(),
  position: z.string().min(1).nullable().optional(),
  department: z.string().min(1).nullable().optional(),
  employmentType: z.enum(["FULL_TIME", "PART_TIME", "CONTRACT", "INTERN"]).nullable().optional(),
  shiftSchedule: z.enum(SHIFT_SCHEDULES).nullable().optional(),
  hireDate: z.string().datetime().nullable().optional(),
  baseSalary: z.number().nonnegative().nullable().optional(),
  baseSalaryCurrency: z.enum(CURRENCIES).nullable().optional(),
  emergencyContactName: z.string().min(1).nullable().optional(),
  emergencyContactPhone: z.string().min(1).nullable().optional(),
  bankName: z.string().min(1).nullable().optional(),
  bankAccountNumber: z.string().min(1).nullable().optional(),
  bankAccountHolderName: z.string().min(1).nullable().optional(),
  status: z.enum(EMPLOYEE_STATUSES).optional(),
});

export type UpdateEmployeeInput = z.infer<typeof updateEmployeeSchema>;
