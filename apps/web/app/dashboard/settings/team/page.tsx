import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { TEAM_MANAGERS, hasRole } from "@/lib/roles";
import { PageHeader } from "@/components/ui/page-header";
import { AccessRestricted } from "../../access-restricted";
import { TeamPanel } from "./team-panel";

export default async function TeamPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  return (
    <div>
      <PageHeader title="Team" description="Manage who can access your dashboard, and what they can do." />
      {hasRole(session.role, TEAM_MANAGERS) ? <TeamPanel currentUserId={session.user.id} /> : <AccessRestricted />}
    </div>
  );
}
