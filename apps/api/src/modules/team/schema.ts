import { z } from "zod";
import { ASSIGNABLE_TEAM_ROLES } from "@business-platform/shared-types";

export const inviteTeamMemberSchema = z.object({
  email: z.string().email(),
  fullName: z.string().min(1),
  role: z.enum(ASSIGNABLE_TEAM_ROLES),
});

export type InviteTeamMemberInput = z.infer<typeof inviteTeamMemberSchema>;

export const updateTeamMemberRoleSchema = z.object({
  role: z.enum(ASSIGNABLE_TEAM_ROLES),
});

export type UpdateTeamMemberRoleInput = z.infer<typeof updateTeamMemberRoleSchema>;
