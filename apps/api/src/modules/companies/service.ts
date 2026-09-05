import type { FastifyInstance } from "fastify";
import type { Company, Prisma } from "@business-platform/db";
import { MODULE_KEYS } from "@business-platform/shared-types";
import { generateUniqueSlug } from "../../lib/slug";

export class HttpError extends Error {
  constructor(
    message: string,
    public statusCode: number
  ) {
    super(message);
  }
}

async function grantTrialEntitlements(prisma: Prisma.TransactionClient, companyId: string) {
  await prisma.entitlement.createMany({
    data: MODULE_KEYS.map((module) => ({ companyId, module, active: true })),
  });
}

export async function listUserCompanies(app: FastifyInstance, userId: string): Promise<Company[]> {
  const user = await app.prisma.user.findUnique({ where: { id: userId }, include: { company: true } });
  if (!user) {
    throw new HttpError("User not found.", 404);
  }

  const memberships = await app.prisma.companyMembership.findMany({
    where: { userId },
    include: { company: true },
  });

  // the user's own home company is always accessible, even if it predates the
  // CompanyMembership table (older accounts won't have an explicit row for it)
  const companies = new Map<string, Company>();
  companies.set(user.company.id, user.company);
  for (const membership of memberships) {
    companies.set(membership.company.id, membership.company);
  }

  return Array.from(companies.values());
}

export async function canAccessCompany(app: FastifyInstance, userId: string, companyId: string): Promise<boolean> {
  const user = await app.prisma.user.findUnique({ where: { id: userId } });
  if (user?.companyId === companyId) {
    return true;
  }

  const membership = await app.prisma.companyMembership.findUnique({
    where: { userId_companyId: { userId, companyId } },
  });
  return membership !== null;
}

export async function createCompanyForUser(app: FastifyInstance, userId: string, name: string): Promise<Company> {
  const user = await app.prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new HttpError("User not found.", 404);
  }
  if (user.role === "MEMBER") {
    throw new HttpError("Employee accounts can't create companies.", 403);
  }

  return app.prisma.$transaction(async (tx) => {
    const slug = await generateUniqueSlug(tx, name);
    const company = await tx.company.create({
      data: { name, slug, accountType: "BUSINESS", onboardingCompletedAt: new Date() },
    });
    await tx.companyMembership.create({ data: { userId, companyId: company.id, role: "OWNER" } });
    await grantTrialEntitlements(tx, company.id);
    return company;
  });
}
