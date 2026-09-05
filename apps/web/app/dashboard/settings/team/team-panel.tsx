"use client";

import { useEffect, useState, type FormEvent } from "react";
import { KeyRound, Plus, Loader2, X } from "lucide-react";
import type { TeamMember, AssignableTeamRole, Employee, TeamRole } from "@business-platform/shared-types";
import {
  ASSIGNABLE_TEAM_ROLES,
  TEAM_ROLE_LABELS,
  TEAM_ROLE_DESCRIPTIONS,
  TEAM_ROLE_ACCESS,
} from "@business-platform/shared-types";
import { apiClient } from "@/lib/api-client";

interface InviteResult {
  member: TeamMember;
  temporaryPassword: string | null;
}

type Source = "employee" | "new";

function getInitials(fullName: string): string {
  return fullName
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

const ROLE_BADGE_STYLES: Record<string, string> = {
  OWNER: "bg-primary/10 text-primary",
  ADMIN: "bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400",
  HR_MANAGER: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400",
  HR_ASSISTANT: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400",
  TREASURER: "bg-amber-50 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400",
};

function AccessBadges({ role }: { role: TeamRole }) {
  return (
    <div className="flex flex-wrap gap-1">
      {TEAM_ROLE_ACCESS[role].map((area) =>
        area === "Full access" ? (
          <span
            key={area}
            className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700 dark:bg-green-900/40 dark:text-green-400"
          >
            {area}
          </span>
        ) : (
          <span
            key={area}
            className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600 dark:bg-slate-700 dark:text-slate-300"
          >
            {area}
          </span>
        )
      )}
    </div>
  );
}

export function TeamPanel({ currentUserId }: { currentUserId: string }) {
  const [members, setMembers] = useState<TeamMember[] | null>(null);
  const [employees, setEmployees] = useState<Employee[] | null>(null);
  const [isInviting, setIsInviting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [source, setSource] = useState<Source>("employee");
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<AssignableTeamRole>("ADMIN");
  const [error, setError] = useState<string | null>(null);
  const [lastInvite, setLastInvite] = useState<InviteResult | null>(null);

  function loadMembers() {
    apiClient
      .get<{ members: TeamMember[] }>("/api/team")
      .then((data) => setMembers(data.members))
      .catch(() => setMembers([]));
  }

  function loadEmployees() {
    apiClient
      .get<{ employees: Employee[] }>("/api/employees")
      .then((data) => setEmployees(data.employees))
      .catch(() => setEmployees([]));
  }

  useEffect(loadMembers, []);
  useEffect(loadEmployees, []);

  const memberEmails = new Set(members?.map((m) => m.email));
  const eligibleEmployees =
    employees?.filter((employee) => {
      const employeeEmail = employee.companyEmail || employee.email;
      return !!employeeEmail && !memberEmails.has(employeeEmail);
    }) ?? [];

  const selectedEmployee = eligibleEmployees.find((employee) => employee.id === selectedEmployeeId) ?? null;
  const resolvedEmail = source === "employee" ? selectedEmployee?.companyEmail || selectedEmployee?.email || "" : email;
  const resolvedFullName = source === "employee" ? selectedEmployee?.fullName ?? "" : fullName;

  function resetInviteForm() {
    setSource("employee");
    setSelectedEmployeeId("");
    setEmail("");
    setFullName("");
    setRole("ADMIN");
  }

  async function handleInvite(e: FormEvent) {
    e.preventDefault();
    if (source === "employee" && !selectedEmployeeId) {
      setError("Choose an employee.");
      return;
    }
    if (!resolvedEmail.trim() || !resolvedFullName.trim()) {
      setError("Enter a name and email.");
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      const result = await apiClient.post<InviteResult>("/api/team/invite", {
        email: resolvedEmail,
        fullName: resolvedFullName,
        role,
      });
      setLastInvite(result);
      resetInviteForm();
      setIsInviting(false);
      loadMembers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong sending the invite.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleRoleChange(memberId: string, newRole: AssignableTeamRole) {
    try {
      await apiClient.patch(`/api/team/${memberId}`, { role: newRole });
      loadMembers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't update that role.");
    }
  }

  async function handleRemove(memberId: string) {
    try {
      await apiClient.delete(`/api/team/${memberId}`);
      loadMembers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't remove that team member.");
    }
  }

  return (
    <div className="space-y-4">
      {lastInvite && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-900/20">
          <div className="flex items-start gap-3">
            <KeyRound className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-500" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-amber-900 dark:text-amber-300">
                {lastInvite.temporaryPassword ? "Team member added" : "Role assigned"}
              </p>
              {lastInvite.temporaryPassword ? (
                <>
                  <p className="mt-1 text-sm text-amber-800 dark:text-amber-400">
                    Share these sign-in details. They&apos;ll be required to set a new password on first login.
                  </p>
                  <div className="mt-2 space-y-1 rounded-lg bg-white px-3 py-2 text-sm text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                    <p>
                      <span className="font-medium">Email:</span> {lastInvite.member.email}
                    </p>
                    <p>
                      <span className="font-medium">Temporary password:</span>{" "}
                      <span className="font-mono">{lastInvite.temporaryPassword}</span>
                    </p>
                  </div>
                </>
              ) : (
                <p className="mt-1 text-sm text-amber-800 dark:text-amber-400">
                  No invite needed — {lastInvite.member.fullName} already has an account and can access it right away with
                  their existing login. Their role is now {TEAM_ROLE_LABELS[lastInvite.member.role]}.
                </p>
              )}
              <button
                type="button"
                onClick={() => setLastInvite(null)}
                className="mt-2 text-sm font-medium text-amber-800 hover:underline dark:text-amber-400"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs font-medium uppercase tracking-wide text-slate-500 dark:border-slate-700 dark:text-slate-400">
                <th className="px-4 py-2">Name</th>
                <th className="px-4 py-2">Email</th>
                <th className="px-4 py-2">Role</th>
                <th className="px-4 py-2">Access</th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {members === null && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-slate-400 dark:text-slate-500">
                    Loading…
                  </td>
                </tr>
              )}
              {members?.map((member) => {
                const isOwnerRow = member.role === "OWNER";
                const isSelf = member.id === currentUserId;
                const locked = isOwnerRow || isSelf;
                return (
                  <tr key={member.id}>
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-2">
                        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                          {getInitials(member.fullName)}
                        </span>
                        <span className="font-medium text-slate-900 dark:text-slate-100">
                          {member.fullName}
                          {isSelf && <span className="ml-1 text-xs font-normal text-slate-400">(you)</span>}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-2 text-slate-600 dark:text-slate-300">{member.email}</td>
                    <td className="px-4 py-2">
                      {isOwnerRow ? (
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${ROLE_BADGE_STYLES.OWNER}`}>
                          Owner
                        </span>
                      ) : (
                        <select
                          value={member.role}
                          onChange={(e) => handleRoleChange(member.id, e.target.value as AssignableTeamRole)}
                          disabled={isSelf}
                          className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs font-medium text-slate-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-60 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
                        >
                          {ASSIGNABLE_TEAM_ROLES.map((value) => (
                            <option key={value} value={value}>
                              {TEAM_ROLE_LABELS[value]}
                            </option>
                          ))}
                        </select>
                      )}
                    </td>
                    <td className="px-4 py-2">
                      <AccessBadges role={member.role} />
                    </td>
                    <td className="px-4 py-2 text-right">
                      {!locked && (
                        <button
                          type="button"
                          onClick={() => handleRemove(member.id)}
                          className="text-xs font-medium text-red-600 hover:underline dark:text-red-400"
                        >
                          Remove
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {isInviting ? (
        <form onSubmit={handleInvite} className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Add a team member</h3>
            <button
              type="button"
              onClick={() => {
                setIsInviting(false);
                resetInviteForm();
              }}
              className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700 dark:hover:text-slate-300"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex gap-1 rounded-lg bg-slate-100 p-1 dark:bg-slate-900">
            <button
              type="button"
              onClick={() => setSource("employee")}
              className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition ${
                source === "employee"
                  ? "bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-slate-100"
                  : "text-slate-500 dark:text-slate-400"
              }`}
            >
              From employee directory
            </button>
            <button
              type="button"
              onClick={() => setSource("new")}
              className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition ${
                source === "new"
                  ? "bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-slate-100"
                  : "text-slate-500 dark:text-slate-400"
              }`}
            >
              New person
            </button>
          </div>

          {source === "employee" ? (
            <div>
              <label htmlFor="team-employee" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Employee
              </label>
              <select
                id="team-employee"
                required
                value={selectedEmployeeId}
                onChange={(e) => setSelectedEmployeeId(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
              >
                <option value="">Select…</option>
                {eligibleEmployees.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.fullName} ({employee.employeeCode}) — {employee.companyEmail || employee.email}
                  </option>
                ))}
              </select>
              {employees !== null && eligibleEmployees.length === 0 && (
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  No eligible employees — they need a personal or company email on file, and can&apos;t already be on the
                  team.
                </p>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="team-fullName" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Full name
                </label>
                <input
                  id="team-fullName"
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Jane Doe"
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500"
                />
              </div>
              <div>
                <label htmlFor="team-email" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Email
                </label>
                <input
                  id="team-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="jane@acme.com"
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500"
                />
              </div>
            </div>
          )}

          <div>
            <label htmlFor="team-role" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Role
            </label>
            <select
              id="team-role"
              value={role}
              onChange={(e) => setRole(e.target.value as AssignableTeamRole)}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
            >
              {ASSIGNABLE_TEAM_ROLES.map((value) => (
                <option key={value} value={value}>
                  {TEAM_ROLE_LABELS[value]}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{TEAM_ROLE_DESCRIPTIONS[role]}</p>
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">{error}</p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : source === "employee" ? "Assign role" : "Send invite"}
          </button>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => {
            setIsInviting(true);
            setError(null);
            loadEmployees();
          }}
          className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white transition hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          Add team member
        </button>
      )}
    </div>
  );
}
