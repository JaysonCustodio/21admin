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

const LOAN_INCLUDE = {
  employee: { select: { fullName: true, employeeCode: true } },
  sinkingFundMember: {
    select: { memberCode: true, manualName: true, employee: { select: { fullName: true } } },
  },
  sinkingFund: { select: { name: true, slug: true } },
  repayments: true,
} as const;

type LoanWithDetails = Prisma.LoanGetPayload<{ include: typeof LOAN_INCLUDE }>;

export async function createLoan(app: FastifyInstance, companyId: string, input: CreateLoanInput): Promise<LoanWithDetails> {
  if (input.fundSource === "SINKING_FUND") {
    const fund = await app.prisma.sinkingFund.findUnique({ where: { id: input.sinkingFundId } });
    if (!fund || fund.companyId !== companyId) {
      throw new HttpError("Sinking fund not found.", 404);
    }
  }

  if (input.borrowerType === "EMPLOYEE") {
    const employee = await app.prisma.employee.findUnique({ where: { id: input.employeeId } });
    if (!employee || employee.companyId !== companyId) {
      throw new HttpError("Employee not found.", 404);
    }
  }

  if (input.borrowerType === "FUND_MEMBER") {
    const member = await app.prisma.sinkingFundMember.findUnique({
      where: { id: input.sinkingFundMemberId },
      include: { sinkingFund: true },
    });
    if (!member || member.sinkingFund.companyId !== companyId) {
      throw new HttpError("Fund member not found.", 404);
    }
  }

  return app.prisma.loan.create({
    data: {
      companyId,
      fundSource: input.fundSource,
      sinkingFundId: input.fundSource === "SINKING_FUND" ? input.sinkingFundId : undefined,
      employeeId: input.borrowerType === "EMPLOYEE" ? input.employeeId : undefined,
      sinkingFundMemberId: input.borrowerType === "FUND_MEMBER" ? input.sinkingFundMemberId : undefined,
      manualBorrowerName: input.borrowerType === "MANUAL" ? input.manualBorrowerName : undefined,
      principal: input.principal,
      interestRate: input.interestRate,
      termMonths: input.termMonths,
    },
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

  const totalPayable = Number(loan.principal) * (1 + Number(loan.interestRate) / 100);
  const paidSoFar = loan.repayments.reduce((sum, repayment) => sum + Number(repayment.amount), 0) + input.amount;
  const isPaidOff = paidSoFar >= totalPayable;

  return app.prisma.loan.update({
    where: { id: loanId },
    data: isPaidOff ? { status: "PAID_OFF" } : {},
    include: LOAN_INCLUDE,
  });
}
