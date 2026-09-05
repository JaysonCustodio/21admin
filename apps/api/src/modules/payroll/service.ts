import type { FastifyInstance } from "fastify";
import type { Prisma } from "@business-platform/db";
import type { RunPayrollInput } from "./schema";

export class HttpError extends Error {
  constructor(
    message: string,
    public statusCode: number
  ) {
    super(message);
  }
}

type PayrollRunWithPayslips = Prisma.PayrollRunGetPayload<{
  include: { payslips: { include: { employee: { select: { fullName: true; employeeCode: true } } } } };
}>;

export async function runPayroll(
  app: FastifyInstance,
  companyId: string,
  input: RunPayrollInput
): Promise<PayrollRunWithPayslips> {
  const periodStart = new Date(input.periodStart);
  const periodEnd = new Date(input.periodEnd);

  const employees = await app.prisma.employee.findMany({
    where: { companyId, status: "ACTIVE", baseSalary: { not: null } },
  });

  if (employees.length === 0) {
    throw new HttpError("No active employees with a base salary to run payroll for.", 400);
  }

  return app.prisma.payrollRun.create({
    data: {
      companyId,
      periodStart,
      periodEnd,
      status: "COMPLETED",
      payslips: {
        create: employees.map((employee) => ({
          employeeId: employee.id,
          grossPay: employee.baseSalary!,
          deductions: 0,
          netPay: employee.baseSalary!,
        })),
      },
    },
    include: { payslips: { include: { employee: { select: { fullName: true, employeeCode: true } } } } },
  });
}

export function listPayrollRuns(app: FastifyInstance, companyId: string): Promise<PayrollRunWithPayslips[]> {
  return app.prisma.payrollRun.findMany({
    where: { companyId },
    orderBy: { periodStart: "desc" },
    include: { payslips: { include: { employee: { select: { fullName: true, employeeCode: true } } } } },
  });
}

type PayslipWithRun = Prisma.PayslipGetPayload<{ include: { payrollRun: true } }>;

export interface EmployeePayslipsForMonth {
  currency: string;
  payslips: PayslipWithRun[];
}

export async function getEmployeePayslipsForMonth(
  app: FastifyInstance,
  userId: string,
  companyId: string,
  year: number,
  month: number
): Promise<EmployeePayslipsForMonth> {
  const employee = await app.prisma.employee.findUnique({ where: { userId } });
  if (!employee || employee.companyId !== companyId) {
    throw new HttpError("No employee record is linked to this account.", 403);
  }

  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 1);

  const [payslips, company] = await Promise.all([
    app.prisma.payslip.findMany({
      where: {
        employeeId: employee.id,
        payrollRun: { periodStart: { lt: end }, periodEnd: { gte: start } },
      },
      include: { payrollRun: true },
      orderBy: { createdAt: "desc" },
    }),
    app.prisma.company.findUnique({ where: { id: companyId }, select: { defaultCurrency: true } }),
  ]);

  return { currency: employee.baseSalaryCurrency ?? company?.defaultCurrency ?? "USD", payslips };
}
