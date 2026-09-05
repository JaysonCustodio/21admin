import type { FastifyInstance } from "fastify";
import type { Prisma, User } from "@business-platform/db";
import { MODULE_KEYS } from "@business-platform/shared-types";
import { hashPassword, verifyPassword } from "./password";
import { generateUniqueSlug } from "../../lib/slug";
import type { RegisterInput, LoginInput } from "./schema";

export class AuthError extends Error {
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

export async function registerWithPassword(app: FastifyInstance, input: RegisterInput): Promise<User> {
  const existing = await app.prisma.user.findUnique({ where: { email: input.email } });
  if (existing) {
    throw new AuthError("An account with this email already exists.", 409);
  }

  const passwordHash = await hashPassword(input.password);

  const user = await app.prisma.$transaction(async (tx) => {
    const name = `${input.fullName}'s Workspace`;
    const slug = await generateUniqueSlug(tx, name);
    const company = await tx.company.create({ data: { name, slug } });
    const createdUser = await tx.user.create({
      data: {
        companyId: company.id,
        email: input.email,
        fullName: input.fullName,
        passwordHash,
        mustChangePassword: false,
      },
    });
    await grantTrialEntitlements(tx, company.id);
    return createdUser;
  });

  return user;
}

export async function loginWithPassword(app: FastifyInstance, input: LoginInput): Promise<User> {
  const user = await app.prisma.user.findUnique({ where: { email: input.email } });
  if (!user?.passwordHash) {
    throw new AuthError("Incorrect email or password.", 401);
  }

  const isValid = await verifyPassword(input.password, user.passwordHash);
  if (!isValid) {
    throw new AuthError("Incorrect email or password.", 401);
  }

  return user;
}

export interface GoogleProfile {
  id: string;
  email: string;
  name: string;
}

export async function findOrCreateFromGoogle(app: FastifyInstance, profile: GoogleProfile): Promise<User> {
  const existingAccount = await app.prisma.oAuthAccount.findUnique({
    where: { provider_providerAccountId: { provider: "GOOGLE", providerAccountId: profile.id } },
    include: { user: true },
  });
  if (existingAccount) {
    return existingAccount.user;
  }

  const existingUser = await app.prisma.user.findUnique({ where: { email: profile.email } });
  if (existingUser) {
    await app.prisma.oAuthAccount.create({
      data: { userId: existingUser.id, provider: "GOOGLE", providerAccountId: profile.id },
    });
    return existingUser;
  }

  const user = await app.prisma.$transaction(async (tx) => {
    const name = `${profile.name}'s Company`;
    const slug = await generateUniqueSlug(tx, name);
    const company = await tx.company.create({ data: { name, slug } });
    const createdUser = await tx.user.create({
      data: {
        companyId: company.id,
        email: profile.email,
        fullName: profile.name,
        mustChangePassword: false,
      },
    });
    await tx.oAuthAccount.create({
      data: { userId: createdUser.id, provider: "GOOGLE", providerAccountId: profile.id },
    });
    await grantTrialEntitlements(tx, company.id);
    return createdUser;
  });

  return user;
}
