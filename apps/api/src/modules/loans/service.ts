import type { FastifyInstance } from "fastify";
import type { Prisma } from "@business-platform/db";
import type { CreateLoanInput, RecordRepaymentInput } from "./schema";

export class HttpError extends Error {
  constructor(
    message: string,
    public statusCode: number
  ) {
    super(message);
  }
}

type LoanWithDetails = Prisma.LoanGetPayload<{
  include: { employee: { select: { fullName: true; employeeCode: true } }; repayments: true };
}>;

const LOAN_INCLUDE = {
  employee: { select: { fullName: true, employeeCode: true } },
  repayments: true,
} as const;

export async function createLoan(app: FastifyInstance, companyId: string, input: CreateLoanInput): Promise<LoanWithDetails> {
  const employee = await app.prisma.employee.findUnique({ where: { id: input.employeeId } });
  if (!employee || employee.companyId !== companyId) {
    throw new HttpError("Employee not found.", 404);
  }

  return app.prisma.loan.create({
    data: { companyId, employeeId: input.employeeId, principal: input.principal, termMonths: input.termMonths },
    include: LOAN_INCLUDE,
  });
}

export function listLoans(app: FastifyInstance, companyId: string): Promise<LoanWithDetails[]> {
  return app.prisma.loan.findMany({
    where: { companyId },
    orderBy: { createdAt: "desc" },
    include: LOAN_INCLUDE,
  });
}

export async function recordRepayment(
  app: FastifyInstance,
  companyId: string,
  loanId: string,
  input: RecordRepaymentInput
): Promise<LoanWithDetails> {
  const loan = await app.prisma.loan.findUnique({ where: { id: loanId }, include: LOAN_INCLUDE });
  if (!loan || loan.companyId !== companyId) {
    throw new HttpError("Loan not found.", 404);
  }
  if (loan.status !== "ACTIVE") {
    throw new HttpError("This loan is no longer active.", 409);
  }

  await app.prisma.loanRepayment.create({ data: { loanId, amount: input.amount } });

  const paidSoFar = loan.repayments.reduce((sum, repayment) => sum + Number(repayment.amount), 0) + input.amount;
  const isPaidOff = paidSoFar >= Number(loan.principal);

  return app.prisma.loan.update({
    where: { id: loanId },
    data: isPaidOff ? { status: "PAID_OFF" } : {},
    include: LOAN_INCLUDE,
  });
}
