import type { FastifyInstance } from "fastify";
import type { Prisma } from "@business-platform/db";
import type { SinkingFundFrequency } from "@business-platform/shared-types";
import { slugify } from "../../lib/slug";
import { hashPassword } from "../auth/password";
import { env } from "../../env";
import type { CreateSinkingFundInput, AddMemberInput } from "./schema";

export class HttpError extends Error {
  constructor(
    message: string,
    public statusCode: number
  ) {
    super(message);
  }
}

const MEMBER_INCLUDE = {
  employee: { select: { fullName: true, employeeCode: true } },
  contributions: { orderBy: { dueDate: "asc" } },
} as const;

const FUND_INCLUDE = {
  members: { include: MEMBER_INCLUDE },
} as const;

type SinkingFundWithMembers = Prisma.SinkingFundGetPayload<{ include: typeof FUND_INCLUDE }>;

function generateDueDates(start: Date, end: Date, frequency: SinkingFundFrequency): Date[] {
  const dates: Date[] = [];
  let current = new Date(start);
  const stepDays = frequency === "WEEKLY" ? 7 : frequency === "SEMI_MONTHLY" ? 15 : null;

  while (current <= end) {
    dates.push(new Date(current));
    if (stepDays) {
      current = new Date(current.getTime() + stepDays * 24 * 60 * 60 * 1000);
    } else {
      const next = new Date(current);
      next.setMonth(next.getMonth() + 1);
      current = next;
    }
  }

  return dates;
}

function randomSlugSuffix(): string {
  return Math.random().toString(36).slice(2, 6);
}

// fund slugs always carry a random suffix (unlike company slugs) since they
// share the same flat /{slug}/login URL space across every company — without
// this, two unrelated companies picking similar names (e.g. "Dev Sinking" vs
// "Dev singking") would produce confusable, easily-mistaken portal links
async function generateUniqueFundSlug(app: FastifyInstance, name: string): Promise<string> {
  const root = slugify(name);

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const candidate = `${root}-${randomSlugSuffix()}`;
    const [existingCompany, existingFund] = await Promise.all([
      app.prisma.company.findUnique({ where: { slug: candidate } }),
      app.prisma.sinkingFund.findUnique({ where: { slug: candidate } }),
    ]);
    if (!existingCompany && !existingFund) return candidate;
  }
}

export async function createSinkingFund(
  app: FastifyInstance,
  companyId: string,
  input: CreateSinkingFundInput
): Promise<SinkingFundWithMembers> {
  const name = input.name.trim();

  const [existingFund, existingCompany] = await Promise.all([
    app.prisma.sinkingFund.findFirst({ where: { name: { equals: name, mode: "insensitive" } } }),
    app.prisma.company.findFirst({ where: { name: { equals: name, mode: "insensitive" } } }),
  ]);
  if (existingFund) {
    throw new HttpError("A fund with this name already exists. Choose a different name.", 409);
  }
  if (existingCompany) {
    throw new HttpError("This name is already used by a company. Choose a different name.", 409);
  }

  const slug = await generateUniqueFundSlug(app, name);

  return app.prisma.sinkingFund.create({
    data: {
      companyId,
      name,
      slug,
      frequency: input.frequency,
      amountPerMember: input.amountPerMember,
      startDate: new Date(input.startDate),
      releaseDate: new Date(input.releaseDate),
    },
    include: FUND_INCLUDE,
  });
}

export function listSinkingFunds(app: FastifyInstance, companyId: string): Promise<SinkingFundWithMembers[]> {
  return app.prisma.sinkingFund.findMany({
    where: { companyId },
    orderBy: { createdAt: "desc" },
    include: FUND_INCLUDE,
  });
}

export async function updateSinkingFundQrCode(
  app: FastifyInstance,
  companyId: string,
  fundId: string,
  qrCodeUrl: string
): Promise<SinkingFundWithMembers> {
  const fund = await app.prisma.sinkingFund.findUnique({ where: { id: fundId } });
  if (!fund || fund.companyId !== companyId) {
    throw new HttpError("Sinking fund not found.", 404);
  }
  return app.prisma.sinkingFund.update({ where: { id: fundId }, data: { qrCodeUrl }, include: FUND_INCLUDE });
}

export async function deleteSinkingFund(app: FastifyInstance, companyId: string, fundId: string): Promise<void> {
  const fund = await app.prisma.sinkingFund.findUnique({ where: { id: fundId } });
  if (!fund || fund.companyId !== companyId) {
    throw new HttpError("Sinking fund not found.", 404);
  }

  const members = await app.prisma.sinkingFundMember.findMany({ where: { sinkingFundId: fundId }, select: { id: true } });
  const memberIds = members.map((m) => m.id);

  await app.prisma.$transaction([
    app.prisma.sinkingFundContribution.deleteMany({ where: { memberId: { in: memberIds } } }),
    app.prisma.sinkingFundMember.deleteMany({ where: { sinkingFundId: fundId } }),
    app.prisma.sinkingFund.delete({ where: { id: fundId } }),
  ]);
}

export async function getSinkingFundBySlug(
  app: FastifyInstance,
  companyId: string,
  slug: string
): Promise<SinkingFundWithMembers> {
  const fund = await app.prisma.sinkingFund.findUnique({ where: { slug }, include: FUND_INCLUDE });
  if (!fund || fund.companyId !== companyId) {
    throw new HttpError("Sinking fund not found.", 404);
  }
  return fund;
}

async function generateMemberCode(app: FastifyInstance, fundId: string): Promise<string> {
  let seq = (await app.prisma.sinkingFundMember.count({ where: { sinkingFundId: fundId } })) + 1;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const code = `MEM-${String(seq).padStart(4, "0")}`;
    const exists = await app.prisma.sinkingFundMember.findUnique({
      where: { sinkingFundId_memberCode: { sinkingFundId: fundId, memberCode: code } },
    });
    if (!exists) return code;
    seq += 1;
  }
}

export interface AddMemberResult {
  fund: SinkingFundWithMembers;
  portalCredentials: { memberCode: string; temporaryPassword: string; portalUrl: string };
}

function generateTemporaryPassword(): string {
  return Math.random().toString(36).slice(2, 10);
}

export async function resetMemberCredentials(
  app: FastifyInstance,
  companyId: string,
  fundId: string,
  memberId: string
): Promise<AddMemberResult> {
  const fund = await app.prisma.sinkingFund.findUnique({ where: { id: fundId } });
  if (!fund || fund.companyId !== companyId) {
    throw new HttpError("Sinking fund not found.", 404);
  }

  const member = await app.prisma.sinkingFundMember.findUnique({ where: { id: memberId } });
  if (!member || member.sinkingFundId !== fundId) {
    throw new HttpError("Member not found.", 404);
  }

  const temporaryPassword = generateTemporaryPassword();
  const passwordHash = await hashPassword(temporaryPassword);
  await app.prisma.sinkingFundMember.update({
    where: { id: memberId },
    data: { passwordHash, mustChangePassword: true },
  });

  const updatedFund = await app.prisma.sinkingFund.findUniqueOrThrow({ where: { id: fundId }, include: FUND_INCLUDE });

  return {
    fund: updatedFund,
    portalCredentials: {
      memberCode: member.memberCode,
      temporaryPassword,
      portalUrl: `${env.WEB_APP_URL}/${fund.slug}/login`,
    },
  };
}

export async function addMember(
  app: FastifyInstance,
  companyId: string,
  fundId: string,
  input: AddMemberInput
): Promise<AddMemberResult> {
  const fund = await app.prisma.sinkingFund.findUnique({ where: { id: fundId } });
  if (!fund || fund.companyId !== companyId) {
    throw new HttpError("Sinking fund not found.", 404);
  }

  if (input.employeeId) {
    const employee = await app.prisma.employee.findUnique({ where: { id: input.employeeId } });
    if (!employee || employee.companyId !== companyId) {
      throw new HttpError("Employee not found.", 404);
    }
    const existing = await app.prisma.sinkingFundMember.findFirst({
      where: { sinkingFundId: fundId, employeeId: input.employeeId },
    });
    if (existing) {
      throw new HttpError("This employee is already a member of this fund.", 409);
    }
  }

  const dueDates = generateDueDates(fund.startDate, fund.releaseDate, fund.frequency);
  const memberCode = await generateMemberCode(app, fundId);
  const temporaryPassword = memberCode;
  const passwordHash = await hashPassword(temporaryPassword);
  const manualName =
    input.manualFirstName && input.manualLastName ? `${input.manualFirstName} ${input.manualLastName}` : undefined;

  await app.prisma.sinkingFundMember.create({
    data: {
      sinkingFundId: fundId,
      employeeId: input.employeeId,
      manualName,
      manualMobile: input.manualMobile,
      manualEmail: input.manualEmail,
      memberCode,
      passwordHash,
      mustChangePassword: true,
      contributions: {
        create: dueDates.map((dueDate) => ({
          dueDate,
          amount: fund.amountPerMember,
        })),
      },
    },
  });

  const updatedFund = await app.prisma.sinkingFund.findUniqueOrThrow({ where: { id: fundId }, include: FUND_INCLUDE });

  return {
    fund: updatedFund,
    portalCredentials: { memberCode, temporaryPassword, portalUrl: `${env.WEB_APP_URL}/${fund.slug}/login` },
  };
}

export async function removeMember(
  app: FastifyInstance,
  companyId: string,
  fundId: string,
  memberId: string
): Promise<SinkingFundWithMembers> {
  const member = await app.prisma.sinkingFundMember.findUnique({ where: { id: memberId } });
  if (!member || member.sinkingFundId !== fundId) {
    throw new HttpError("Member not found.", 404);
  }
  const fund = await app.prisma.sinkingFund.findUnique({ where: { id: fundId } });
  if (!fund || fund.companyId !== companyId) {
    throw new HttpError("Sinking fund not found.", 404);
  }

  await app.prisma.$transaction([
    app.prisma.sinkingFundContribution.deleteMany({ where: { memberId } }),
    app.prisma.sinkingFundMember.delete({ where: { id: memberId } }),
  ]);

  return app.prisma.sinkingFund.findUniqueOrThrow({ where: { id: fundId }, include: FUND_INCLUDE });
}

export async function setContributionPaid(
  app: FastifyInstance,
  companyId: string,
  fundId: string,
  contributionId: string,
  paid: boolean
): Promise<SinkingFundWithMembers> {
  const contribution = await app.prisma.sinkingFundContribution.findUnique({
    where: { id: contributionId },
    include: { member: { include: { sinkingFund: true } } },
  });
  if (!contribution || contribution.member.sinkingFundId !== fundId || contribution.member.sinkingFund.companyId !== companyId) {
    throw new HttpError("Contribution not found.", 404);
  }

  await app.prisma.sinkingFundContribution.update({
    where: { id: contributionId },
    data: { paid, paidAt: paid ? new Date() : null },
  });

  return app.prisma.sinkingFund.findUniqueOrThrow({ where: { id: fundId }, include: FUND_INCLUDE });
}
