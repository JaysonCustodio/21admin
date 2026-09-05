import type { FastifyInstance } from "fastify";
import type { User } from "@business-platform/db";
import { TEAM_ROLES } from "@business-platform/shared-types";
import { hashPassword } from "../auth/password";
import type { InviteTeamMemberInput, UpdateTeamMemberRoleInput } from "./schema";

export class HttpError extends Error {
  constructor(
    message: string,
    public statusCode: number
  ) {
    super(message);
  }
}

function generateTemporaryPassword(): string {
  return Math.random().toString(36).slice(2, 10);
}

export function listTeamMembers(app: FastifyInstance, companyId: string): Promise<User[]> {
  return app.prisma.user.findMany({
    where: { companyId, role: { in: [...TEAM_ROLES] } },
    orderBy: { createdAt: "asc" },
  });
}

export interface InviteResult {
  user: User;
  temporaryPassword: string | null;
}

export async function inviteTeamMember(
  app: FastifyInstance,
  companyId: string,
  input: InviteTeamMemberInput
): Promise<InviteResult> {
  const existing = await app.prisma.user.findUnique({ where: { email: input.email } });

  if (existing) {
    if (existing.companyId !== companyId) {
      throw new HttpError("This email belongs to an account in a different company.", 409);
    }
    if (existing.role === "OWNER") {
      throw new HttpError("The owner's role can't be changed.", 403);
    }
    const updated = await app.prisma.user.update({ where: { id: existing.id }, data: { role: input.role } });
    return { user: updated, temporaryPassword: null };
  }

  const temporaryPassword = generateTemporaryPassword();
  const passwordHash = await hashPassword(temporaryPassword);
  const user = await app.prisma.user.create({
    data: {
      companyId,
      email: input.email,
      fullName: input.fullName,
      passwordHash,
      role: input.role,
      mustChangePassword: true,
    },
  });

  return { user, temporaryPassword };
}

export async function updateTeamMemberRole(
  app: FastifyInstance,
  companyId: string,
  userId: string,
  input: UpdateTeamMemberRoleInput
): Promise<User> {
  const user = await app.prisma.user.findUnique({ where: { id: userId } });
  if (!user || user.companyId !== companyId) {
    throw new HttpError("Team member not found.", 404);
  }
  if (user.role === "OWNER") {
    throw new HttpError("The owner's role can't be changed.", 403);
  }

  return app.prisma.user.update({ where: { id: userId }, data: { role: input.role } });
}

export async function removeTeamMember(
  app: FastifyInstance,
  companyId: string,
  userId: string,
  requesterId: string
): Promise<User> {
  const user = await app.prisma.user.findUnique({ where: { id: userId } });
  if (!user || user.companyId !== companyId) {
    throw new HttpError("Team member not found.", 404);
  }
  if (user.role === "OWNER") {
    throw new HttpError("The owner can't be removed.", 403);
  }
  if (user.id === requesterId) {
    throw new HttpError("You can't remove yourself from the team.", 403);
  }

  return app.prisma.user.update({ where: { id: userId }, data: { role: "MEMBER" } });
}
