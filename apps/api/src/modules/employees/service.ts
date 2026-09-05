import type { FastifyInstance } from "fastify";
import type { Employee, Prisma } from "@business-platform/db";
import { hashPassword } from "../auth/password";
import type { CreateEmployeeInput, UpdateEmployeeInput } from "./schema";

export function updateEmployeePhoto(app: FastifyInstance, id: string, profileImageUrl: string): Promise<Employee> {
  return app.prisma.employee.update({ where: { id }, data: { profileImageUrl } });
}

export class HttpError extends Error {
  constructor(
    message: string,
    public statusCode: number
  ) {
    super(message);
  }
}

export function listEmployees(app: FastifyInstance, companyId: string): Promise<Employee[]> {
  return app.prisma.employee.findMany({
    where: { companyId },
    orderBy: { createdAt: "desc" },
  });
}

export async function getEmployee(app: FastifyInstance, companyId: string, id: string): Promise<Employee> {
  const employee = await app.prisma.employee.findUnique({ where: { id } });
  if (!employee || employee.companyId !== companyId) {
    throw new HttpError("Employee not found.", 404);
  }
  return employee;
}

async function getEmployeeCodePrefix(app: FastifyInstance, companyId: string): Promise<string> {
  const company = await app.prisma.company.findUnique({ where: { id: companyId }, select: { name: true } });
  const letters = (company?.name ?? "").replace(/[^a-zA-Z0-9]/g, "").slice(0, 3).toUpperCase();
  return letters.padEnd(3, "X") || "EMP";
}

async function generateEmployeeCode(app: FastifyInstance, companyId: string): Promise<string> {
  const prefix = await getEmployeeCodePrefix(app, companyId);
  let seq = (await app.prisma.employee.count({ where: { companyId } })) + 1;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const code = `${prefix}-${String(seq).padStart(4, "0")}`;
    const exists = await app.prisma.employee.findUnique({
      where: { companyId_employeeCode: { companyId, employeeCode: code } },
    });
    if (!exists) return code;
    seq += 1;
  }
}

async function assertEmployeeCodeAvailable(app: FastifyInstance, companyId: string, employeeCode: string, excludeId?: string) {
  const existing = await app.prisma.employee.findUnique({
    where: { companyId_employeeCode: { companyId, employeeCode } },
  });
  if (existing && existing.id !== excludeId) {
    throw new HttpError(`Employee ID "${employeeCode}" is already in use.`, 409);
  }
}

export interface PortalCredentials {
  email: string;
  temporaryPassword: string;
}

export interface CreateEmployeeResult {
  employee: Employee;
  portalCredentials: PortalCredentials | null;
}

export async function createEmployee(
  app: FastifyInstance,
  companyId: string,
  input: CreateEmployeeInput
): Promise<CreateEmployeeResult> {
  const employeeCode = input.employeeCode?.trim() || (await generateEmployeeCode(app, companyId));
  await assertEmployeeCodeAvailable(app, companyId, employeeCode);

  const company = await app.prisma.company.findUnique({ where: { id: companyId }, select: { defaultCurrency: true } });
  const portalEmail = input.companyEmail || input.email;
  let portalCredentials: PortalCredentials | null = null;
  let userId: string | undefined;

  if (portalEmail) {
    const existingUser = await app.prisma.user.findUnique({ where: { email: portalEmail } });
    if (!existingUser) {
      const temporaryPassword = employeeCode;
      const passwordHash = await hashPassword(temporaryPassword);
      const portalUser = await app.prisma.user.create({
        data: {
          companyId,
          email: portalEmail,
          fullName: input.fullName,
          passwordHash,
          role: "MEMBER",
          mustChangePassword: true,
        },
      });
      userId = portalUser.id;
      portalCredentials = { email: portalEmail, temporaryPassword };
    }
  }

  const employee = await app.prisma.employee.create({
    data: {
      companyId,
      employeeCode,
      fullName: input.fullName,
      email: input.email,
      companyEmail: input.companyEmail,
      phone: input.phone,
      dateOfBirth: input.dateOfBirth ? new Date(input.dateOfBirth) : undefined,
      address: input.address,
      position: input.position,
      department: input.department,
      employmentType: input.employmentType,
      shiftSchedule: input.shiftSchedule,
      hireDate: input.hireDate ? new Date(input.hireDate) : undefined,
      baseSalary: input.baseSalary,
      baseSalaryCurrency: input.baseSalary ? (input.baseSalaryCurrency ?? company?.defaultCurrency ?? "USD") : undefined,
      emergencyContactName: input.emergencyContactName,
      emergencyContactPhone: input.emergencyContactPhone,
      bankName: input.bankName,
      bankAccountNumber: input.bankAccountNumber,
      bankAccountHolderName: input.bankAccountHolderName,
      userId,
    },
  });

  return { employee, portalCredentials };
}

export interface UpdateEmployeeResult {
  employee: Employee;
  portalCredentials: PortalCredentials | null;
}

export async function updateEmployee(
  app: FastifyInstance,
  companyId: string,
  id: string,
  input: UpdateEmployeeInput
): Promise<UpdateEmployeeResult> {
  const existing = await getEmployee(app, companyId, id);

  const employeeCode = input.employeeCode?.trim();
  if (employeeCode && employeeCode !== existing.employeeCode) {
    await assertEmployeeCodeAvailable(app, companyId, employeeCode, id);
  }
  const effectiveEmployeeCode = employeeCode || existing.employeeCode;

  const data: Prisma.EmployeeUpdateInput = {};

  if (employeeCode) data.employeeCode = employeeCode;
  if (input.fullName !== undefined) data.fullName = input.fullName;
  if (input.email !== undefined) data.email = input.email;
  if (input.companyEmail !== undefined) data.companyEmail = input.companyEmail;
  if (input.phone !== undefined) data.phone = input.phone;
  if (input.dateOfBirth !== undefined) data.dateOfBirth = input.dateOfBirth ? new Date(input.dateOfBirth) : null;
  if (input.address !== undefined) data.address = input.address;
  if (input.position !== undefined) data.position = input.position;
  if (input.department !== undefined) data.department = input.department;
  if (input.employmentType !== undefined) data.employmentType = input.employmentType;
  if (input.shiftSchedule !== undefined) data.shiftSchedule = input.shiftSchedule;
  if (input.hireDate !== undefined) data.hireDate = input.hireDate ? new Date(input.hireDate) : null;
  if (input.baseSalary !== undefined) data.baseSalary = input.baseSalary;
  if (input.baseSalaryCurrency !== undefined) data.baseSalaryCurrency = input.baseSalaryCurrency;
  if (input.emergencyContactName !== undefined) data.emergencyContactName = input.emergencyContactName;
  if (input.emergencyContactPhone !== undefined) data.emergencyContactPhone = input.emergencyContactPhone;
  if (input.bankName !== undefined) data.bankName = input.bankName;
  if (input.bankAccountNumber !== undefined) data.bankAccountNumber = input.bankAccountNumber;
  if (input.bankAccountHolderName !== undefined) data.bankAccountHolderName = input.bankAccountHolderName;
  if (input.status !== undefined) data.status = input.status;

  // if the employee doesn't have a portal account yet but now has a usable email, create one
  let portalCredentials: PortalCredentials | null = null;
  if (!existing.userId) {
    const resolvedCompanyEmail = input.companyEmail !== undefined ? input.companyEmail : existing.companyEmail;
    const resolvedEmail = input.email !== undefined ? input.email : existing.email;
    const portalEmail = resolvedCompanyEmail || resolvedEmail;

    if (portalEmail) {
      const existingUser = await app.prisma.user.findUnique({ where: { email: portalEmail } });
      if (!existingUser) {
        const temporaryPassword = effectiveEmployeeCode;
        const passwordHash = await hashPassword(temporaryPassword);
        const portalUser = await app.prisma.user.create({
          data: {
            companyId,
            email: portalEmail,
            fullName: input.fullName ?? existing.fullName,
            passwordHash,
            role: "MEMBER",
            mustChangePassword: true,
          },
        });
        data.user = { connect: { id: portalUser.id } };
        portalCredentials = { email: portalEmail, temporaryPassword };
      }
    }
  }

  const employee = await app.prisma.employee.update({ where: { id }, data });
  return { employee, portalCredentials };
}
