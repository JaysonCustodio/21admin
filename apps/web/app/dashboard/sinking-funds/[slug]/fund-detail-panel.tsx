"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { ChevronLeft, ChevronRight, Loader2, Plus, X, UserPlus, Check, KeyRound, Undo2, Zap, Trash2, Search } from "lucide-react";
import type {
  SinkingFundWithMembers,
  SinkingFundFrequency,
  EmployeeLookup,
  SinkingFundMemberPortalCredentials,
  LoanWithDetails,
} from "@business-platform/shared-types";
import { apiClient, API_BASE_URL } from "@/lib/api-client";
import { CopyButton } from "@/components/ui/copy-button";
import { AvatarUpload } from "@/components/ui/avatar-upload";
import { Pagination } from "@/components/ui/pagination";
import { MemberDetailModal } from "./member-detail-modal";

const PAGE_SIZE = 10;

const FREQUENCY_LABELS: Record<SinkingFundFrequency, string> = {
  WEEKLY: "Weekly",
  SEMI_MONTHLY: "Twice a month",
  MONTHLY: "Monthly",
};

type StatusFilter = "ALL" | "PAID" | "UNPAID";
type AddMemberSource = "employee" | "manual";

function formatCurrency(value: number, currency: string): string {
  return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(value);
}

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function memberName(member: SinkingFundWithMembers["members"][number]): string {
  return member.employee?.fullName ?? member.manualName ?? "Unknown";
}

function AddMemberRow({
  fundId,
  existingEmployeeIds,
  showEmployeeOption,
  onAdded,
}: {
  fundId: string;
  existingEmployeeIds: Set<string>;
  showEmployeeOption: boolean;
  onAdded: (credentials: SinkingFundMemberPortalCredentials) => void;
}) {
  const [isAdding, setIsAdding] = useState(false);
  const [source, setSource] = useState<AddMemberSource>(showEmployeeOption ? "employee" : "manual");
  const [employees, setEmployees] = useState<EmployeeLookup[] | null>(null);
  const [employeeId, setEmployeeId] = useState("");
  const [manualFirstName, setManualFirstName] = useState("");
  const [manualLastName, setManualLastName] = useState("");
  const [manualMobile, setManualMobile] = useState("");
  const [manualEmail, setManualEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function openAdd() {
    setIsAdding(true);
    setError(null);
    if (!showEmployeeOption) return;
    apiClient
      .get<{ employees: EmployeeLookup[] }>("/api/employees/lookup")
      .then((data) => setEmployees(data.employees.filter((e) => e.status === "ACTIVE" && !existingEmployeeIds.has(e.id))))
      .catch(() => setEmployees([]));
  }

  function resetManualFields() {
    setManualFirstName("");
    setManualLastName("");
    setManualMobile("");
    setManualEmail("");
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (source === "employee" && !employeeId) {
      setError("Choose an employee.");
      return;
    }
    if (source === "manual" && (!manualFirstName.trim() || !manualLastName.trim())) {
      setError("Enter a first and last name.");
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      const { portalCredentials } = await apiClient.post<{ portalCredentials: SinkingFundMemberPortalCredentials }>(
        `/api/sinking-funds/${fundId}/members`,
        {
          employeeId: source === "employee" ? employeeId : undefined,
          manualFirstName: source === "manual" ? manualFirstName : undefined,
          manualLastName: source === "manual" ? manualLastName : undefined,
          manualMobile: source === "manual" && manualMobile ? manualMobile : undefined,
          manualEmail: source === "manual" && manualEmail ? manualEmail : undefined,
        }
      );
      setIsAdding(false);
      setEmployeeId("");
      resetManualFields();
      onAdded(portalCredentials);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't add that member.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!isAdding) {
    return (
      <button
        type="button"
        onClick={openAdd}
        className="flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
      >
        <UserPlus className="h-3.5 w-3.5" />
        Add member
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border border-slate-200 p-3 dark:border-slate-700">
      {showEmployeeOption && (
        <div className="flex gap-1 rounded-lg bg-slate-100 p-1 dark:bg-slate-900">
          <button
            type="button"
            onClick={() => setSource("employee")}
            className={`flex-1 rounded-md px-2.5 py-1 text-xs font-medium transition ${
              source === "employee"
                ? "bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-slate-100"
                : "text-slate-500 dark:text-slate-400"
            }`}
          >
            From employee directory
          </button>
          <button
            type="button"
            onClick={() => setSource("manual")}
            className={`flex-1 rounded-md px-2.5 py-1 text-xs font-medium transition ${
              source === "manual"
                ? "bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-slate-100"
                : "text-slate-500 dark:text-slate-400"
            }`}
          >
            Manual entry
          </button>
        </div>
      )}

      <div className={showEmployeeOption ? "mt-2" : ""}>
        {source === "employee" ? (
          <div className="flex items-center gap-2">
            <select
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              className="flex-1 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-sm text-slate-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
            >
              <option value="">{employees === null ? "Loading…" : "Select…"}</option>
              {employees?.map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.fullName} ({employee.employeeCode})
                </option>
              ))}
            </select>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-white transition hover:bg-primary/90 disabled:opacity-60"
            >
              {isSubmitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Add"}
            </button>
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="rounded-lg px-2 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                value={manualFirstName}
                onChange={(e) => setManualFirstName(e.target.value)}
                placeholder="First name"
                className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500"
              />
              <input
                type="text"
                value={manualLastName}
                onChange={(e) => setManualLastName(e.target.value)}
                placeholder="Last name"
                className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="tel"
                value={manualMobile}
                onChange={(e) => setManualMobile(e.target.value)}
                placeholder="Mobile number (optional)"
                className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500"
              />
              <input
                type="email"
                value={manualEmail}
                onChange={(e) => setManualEmail(e.target.value)}
                placeholder="Email (optional)"
                className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-white transition hover:bg-primary/90 disabled:opacity-60"
              >
                {isSubmitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Add"}
              </button>
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="rounded-lg px-2 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
      {error && <p className="mt-1.5 text-xs text-red-600 dark:text-red-400">{error}</p>}
    </form>
  );
}

export function FundDetailPanel({
  slug,
  defaultCurrency,
  isBusinessAccount,
}: {
  slug: string;
  defaultCurrency: string;
  isBusinessAccount: boolean;
}) {
  const [fund, setFund] = useState<SinkingFundWithMembers | null>(null);
  const [loans, setLoans] = useState<LoanWithDetails[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriodIndex, setSelectedPeriodIndex] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [newMemberCredentials, setNewMemberCredentials] = useState<Record<string, SinkingFundMemberPortalCredentials>>({});
  const [origin, setOrigin] = useState("");
  const [advanceMemberId, setAdvanceMemberId] = useState<string | null>(null);
  const [advanceCount, setAdvanceCount] = useState(1);
  const [detailMemberId, setDetailMemberId] = useState<string | null>(null);
  const [memberToRemove, setMemberToRemove] = useState<SinkingFundWithMembers["members"][number] | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);
  const [isUploadingQr, setIsUploadingQr] = useState(false);
  const [isAdvancing, setIsAdvancing] = useState(false);

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  function loadFund(): Promise<SinkingFundWithMembers | null> {
    return apiClient
      .get<{ fund: SinkingFundWithMembers }>(`/api/sinking-funds/by-slug/${slug}`)
      .then((data) => {
        setFund(data.fund);
        return data.fund;
      })
      .catch(() => {
        setError("Couldn't load this fund.");
        return null;
      });
  }

  useEffect(() => {
    loadFund();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  useEffect(() => {
    apiClient
      .get<{ loans: LoanWithDetails[] }>("/api/loans")
      .then((data) => setLoans(data.loans))
      .catch(() => setLoans([]));
  }, [slug]);

  const fundLoans = useMemo(() => {
    if (!fund || !loans) return [];
    return loans.filter((loan) => loan.sinkingFundId === fund.id);
  }, [fund, loans]);

  // outstanding principal still owed back — floored per loan since a loan can't "owe" a negative amount
  const totalLoanedOut = useMemo(() => {
    return fundLoans.reduce((sum, loan) => {
      if (loan.status === "PAID_OFF") return sum;
      const repaid = loan.repayments.reduce((s, r) => s + Number(r.amount), 0);
      return sum + Math.max(0, Number(loan.principal) - repaid);
    }, 0);
  }, [fundLoans]);

  const activeLoanCount = useMemo(() => fundLoans.filter((loan) => loan.status === "ACTIVE").length, [fundLoans]);

  // cash actually available to the fund: every peso disbursed as principal leaves the fund,
  // and every peso repaid (principal AND interest) comes back in — so a fully repaid loan
  // returns more than it took out, and that interest becomes available too
  const totalPrincipalDisbursed = useMemo(() => fundLoans.reduce((sum, loan) => sum + Number(loan.principal), 0), [fundLoans]);
  const totalRepaymentsReceived = useMemo(
    () => fundLoans.reduce((sum, loan) => sum + loan.repayments.reduce((s, r) => s + Number(r.amount), 0), 0),
    [fundLoans]
  );

  // interest actually collected so far — only the portion of repayments beyond what's
  // needed to return the principal counts as revenue earned by the fund
  const totalLoanRevenue = useMemo(() => {
    return fundLoans.reduce((sum, loan) => {
      const repaid = loan.repayments.reduce((s, r) => s + Number(r.amount), 0);
      return sum + Math.max(0, repaid - Number(loan.principal));
    }, 0);
  }, [fundLoans]);

  const periods = useMemo(() => {
    if (!fund || fund.members.length === 0) return [];
    const dates = fund.members[0].contributions.map((c) => c.dueDate);
    return Array.from(new Set(dates)).sort();
  }, [fund]);

  useEffect(() => {
    if (fund && selectedPeriodIndex === null && periods.length > 0) {
      let idx = periods.findIndex((period) =>
        fund.members.some((m) => m.contributions.some((c) => c.dueDate === period && !c.paid))
      );
      if (idx === -1) idx = periods.length - 1;
      setSelectedPeriodIndex(idx);
    }
  }, [fund, periods, selectedPeriodIndex]);

  const selectedPeriod = selectedPeriodIndex !== null ? periods[selectedPeriodIndex] : null;

  const totalContributed = useMemo(() => {
    if (!fund) return 0;
    return fund.members.reduce(
      (sum, m) => sum + m.contributions.filter((c) => c.paid).reduce((s, c) => s + Number(c.amount), 0),
      0
    );
  }, [fund]);

  const totalDue = useMemo(() => {
    if (!fund) return 0;
    return fund.members.reduce((sum, m) => sum + m.contributions.reduce((s, c) => s + Number(c.amount), 0), 0);
  }, [fund]);

  const nearestPeriod = useMemo(() => {
    if (!fund) return null;
    for (const period of periods) {
      const unpaidCount = fund.members.filter((m) =>
        m.contributions.some((c) => c.dueDate === period && !c.paid)
      ).length;
      if (unpaidCount > 0) {
        return { date: period, paidCount: fund.members.length - unpaidCount, total: fund.members.length };
      }
    }
    return null;
  }, [fund, periods]);

  const rows = useMemo(() => {
    if (!fund || !selectedPeriod) return [];
    const withContribution = fund.members.map((member) => ({
      member,
      contribution: member.contributions.find((c) => c.dueDate === selectedPeriod),
      nextUnpaid: member.contributions.find((c) => !c.paid) ?? null,
    }));

    return withContribution
      .filter(
        (
          row
        ): row is {
          member: (typeof fund.members)[number];
          contribution: NonNullable<(typeof withContribution)[number]["contribution"]>;
          nextUnpaid: (typeof withContribution)[number]["nextUnpaid"];
        } => row.contribution !== undefined
      )
      .filter(({ contribution }) => {
        if (statusFilter === "ALL") return true;
        return statusFilter === "PAID" ? contribution.paid : !contribution.paid;
      })
      .filter(({ member }) => {
        const query = searchQuery.trim().toLowerCase();
        if (!query) return true;
        return (
          memberName(member).toLowerCase().includes(query) ||
          member.memberCode.toLowerCase().includes(query) ||
          (member.manualMobile?.toLowerCase().includes(query) ?? false) ||
          (member.manualEmail?.toLowerCase().includes(query) ?? false)
        );
      });
  }, [fund, selectedPeriod, statusFilter, searchQuery]);

  useEffect(() => {
    setPage(1);
  }, [selectedPeriod, statusFilter, searchQuery]);

  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const paginatedRows = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function goToPreviousPeriod() {
    setSelectedPeriodIndex((i) => (i !== null ? Math.max(0, i - 1) : i));
  }

  function goToNextPeriod() {
    setSelectedPeriodIndex((i) => (i !== null && periods.length > 0 ? Math.min(periods.length - 1, i + 1) : i));
  }

  async function handleTogglePaid(contributionId: string, paid: boolean) {
    if (!fund) return;
    try {
      await apiClient.patch(`/api/sinking-funds/${fund.id}/contributions/${contributionId}`, { paid });
      loadFund();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't update that contribution.");
    }
  }

  function openAdvanceChooser(memberId: string) {
    setAdvanceMemberId(memberId);
    setAdvanceCount(1);
  }

  async function handleConfirmAdvance(member: SinkingFundWithMembers["members"][number]) {
    if (!fund) return;
    const unpaidInOrder = member.contributions.filter((c) => !c.paid);
    const toPay = unpaidInOrder.slice(0, advanceCount);
    if (toPay.length === 0) return;

    setIsAdvancing(true);
    try {
      await Promise.all(
        toPay.map((c) => apiClient.patch(`/api/sinking-funds/${fund.id}/contributions/${c.id}`, { paid: true }))
      );
      setAdvanceMemberId(null);
      loadFund();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't advance those payments.");
    } finally {
      setIsAdvancing(false);
    }
  }

  async function handleQrUpload(file: File) {
    if (!fund) return;
    setIsUploadingQr(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      await apiClient.upload(`/api/sinking-funds/${fund.id}/qr-code`, formData);
      loadFund();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong uploading the QR code.");
    } finally {
      setIsUploadingQr(false);
    }
  }

  async function handleRemoveMember(memberId: string) {
    if (!fund) return;
    setIsRemoving(true);
    try {
      await apiClient.delete(`/api/sinking-funds/${fund.id}/members/${memberId}`);
      setMemberToRemove(null);
      loadFund();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't remove that member.");
    } finally {
      setIsRemoving(false);
    }
  }

  async function handleMemberAdded(credentials: SinkingFundMemberPortalCredentials) {
    const updated = await loadFund();
    const match = updated?.members.find((m) => m.memberCode === credentials.memberCode);
    if (match) {
      setNewMemberCredentials((prev) => ({ ...prev, [match.id]: credentials }));
    }
  }

  async function handleResetCredentials(memberId: string) {
    if (!fund) return;
    try {
      const { portalCredentials } = await apiClient.post<{ portalCredentials: SinkingFundMemberPortalCredentials }>(
        `/api/sinking-funds/${fund.id}/members/${memberId}/reset-credentials`,
        {}
      );
      setNewMemberCredentials((prev) => ({ ...prev, [memberId]: portalCredentials }));
      loadFund();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't reset that member's login.");
    }
  }

  function dismissCredentials(memberId: string) {
    setNewMemberCredentials((prev) => {
      const next = { ...prev };
      delete next[memberId];
      return next;
    });
  }

  if (error && !fund) {
    return <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">{error}</p>;
  }

  if (!fund) {
    return <p className="text-sm text-slate-400 dark:text-slate-500">Loading…</p>;
  }

  const existingEmployeeIds = new Set(fund.members.map((m) => m.employeeId).filter((id): id is string => !!id));
  const portalUrl = `${origin}/${fund.slug}/login`;

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {FREQUENCY_LABELS[fund.frequency]} · {formatCurrency(Number(fund.amountPerMember), defaultCurrency)} per member ·{" "}
          {formatDate(fund.startDate)} – {formatDate(fund.releaseDate)}
        </p>
        {origin && (
          <div className="mt-2 flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-1.5 dark:bg-slate-900">
            <span className="flex-1 truncate font-mono text-xs text-primary">{portalUrl}</span>
            <CopyButton value={portalUrl} label="member portal link" />
          </div>
        )}

        <div className="mt-4 border-t border-slate-100 pt-4 dark:border-slate-700">
          <AvatarUpload
            shape="square"
            size={88}
            imageUrl={fund.qrCodeUrl ? `${API_BASE_URL}${fund.qrCodeUrl}` : null}
            fallbackText="QR"
            onFileSelected={handleQrUpload}
            isUploading={isUploadingQr}
            label="Payment QR code"
            helpText="Shown to members when they tap Pay Now in their portal."
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">
            Total contributed
          </p>
          <p className="mt-1 text-2xl font-semibold text-slate-900 dark:text-slate-100">
            {formatCurrency(totalContributed, defaultCurrency)}
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">of {formatCurrency(totalDue, defaultCurrency)} total</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">Loaned out</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900 dark:text-slate-100">
            {formatCurrency(totalLoanedOut, defaultCurrency)}
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {activeLoanCount} active loan{activeLoanCount === 1 ? "" : "s"}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">Loan revenue</p>
          <p className="mt-1 text-2xl font-semibold text-emerald-600 dark:text-emerald-400">
            {formatCurrency(totalLoanRevenue, defaultCurrency)}
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">interest collected so far</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">Available funds</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900 dark:text-slate-100">
            {formatCurrency(Math.max(0, totalContributed - totalPrincipalDisbursed + totalRepaymentsReceived), defaultCurrency)}
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">contributed, minus loans out, plus payments in</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">
            Nearest next payment
          </p>
          {nearestPeriod ? (
            <>
              <p className="mt-1 text-2xl font-semibold text-slate-900 dark:text-slate-100">
                {formatDate(nearestPeriod.date)}
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {nearestPeriod.paidCount} / {nearestPeriod.total} members paid
              </p>
            </>
          ) : (
            <p className="mt-1 text-lg font-semibold text-emerald-600 dark:text-emerald-400">All periods paid</p>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={goToPreviousPeriod}
              disabled={selectedPeriodIndex === 0}
              aria-label="Previous period"
              className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 dark:text-slate-400 dark:hover:bg-slate-700"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="min-w-[9rem] text-center text-sm font-medium text-slate-700 dark:text-slate-300">
              {selectedPeriod ? formatDate(selectedPeriod) : "—"}
            </span>
            <button
              type="button"
              onClick={goToNextPeriod}
              disabled={selectedPeriodIndex === periods.length - 1}
              aria-label="Next period"
              className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 dark:text-slate-400 dark:hover:bg-slate-700"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search members…"
                className="w-40 rounded-lg border border-slate-300 py-1.5 pl-8 pr-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500"
              />
            </div>
            <div className="flex gap-1 rounded-lg bg-slate-100 p-1 dark:bg-slate-900">
              {(["ALL", "PAID", "UNPAID"] as StatusFilter[]).map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setStatusFilter(value)}
                  className={`rounded-md px-2.5 py-1 text-xs font-medium transition ${
                    statusFilter === value
                      ? "bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-slate-100"
                      : "text-slate-500 dark:text-slate-400"
                  }`}
                >
                  {value === "ALL" ? "All" : value === "PAID" ? "Paid" : "Not yet paid"}
                </button>
              ))}
            </div>
          </div>
        </div>

        {error && (
          <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">{error}</p>
        )}

        <div className="mt-3 overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs font-medium uppercase tracking-wide text-slate-500 dark:border-slate-700 dark:text-slate-400">
                <th className="px-3 py-2">Member</th>
                <th className="px-3 py-2">Amount</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Next payment</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {paginatedRows.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-3 py-4 text-center text-slate-400 dark:text-slate-500">
                    No members match this filter.
                  </td>
                </tr>
              )}
              {paginatedRows.map(({ member, contribution, nextUnpaid }) => {
                // "advance payment" = paying a later period while an earlier one for
                // this member is still unpaid — i.e. this isn't their actual next-due contribution
                const isAdvance = !contribution.paid && nextUnpaid !== null && nextUnpaid.id !== contribution.id;
                const isOverdue = !contribution.paid && new Date(contribution.dueDate) < new Date();
                // once this period is settled, offer to pay the member's next upcoming
                // period right away instead of waiting for it to become the selected one
                const canPayAhead = contribution.paid && nextUnpaid !== null;
                return (
                  <tr
                    key={member.id}
                    onClick={() => setDetailMemberId(member.id)}
                    className="cursor-pointer transition hover:bg-slate-50 dark:hover:bg-slate-900"
                  >
                    <td className="px-3 py-2">
                      <p className="font-medium text-slate-900 hover:underline dark:text-slate-100">{memberName(member)}</p>
                      {newMemberCredentials[member.id] && (
                        <div
                          className="mt-1 inline-flex items-center gap-1.5 rounded-md bg-amber-50 px-1.5 py-0.5 text-xs text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <KeyRound className="h-3 w-3 shrink-0" />
                          <span className="font-mono">{newMemberCredentials[member.id].memberCode}</span>
                          <CopyButton value={newMemberCredentials[member.id].memberCode} label="member code" />
                          <span className="text-amber-400 dark:text-amber-600">/</span>
                          <span className="font-mono">{newMemberCredentials[member.id].temporaryPassword}</span>
                          <CopyButton value={newMemberCredentials[member.id].temporaryPassword} label="temporary password" />
                          <button
                            type="button"
                            onClick={() => dismissCredentials(member.id)}
                            className="text-amber-600 hover:text-amber-800 dark:text-amber-500 dark:hover:text-amber-300"
                            aria-label="Dismiss"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-2 text-slate-600 dark:text-slate-300">
                      {formatCurrency(Number(contribution.amount), defaultCurrency)}
                    </td>
                    <td className="px-3 py-2">
                      {contribution.paid ? (
                        <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400">
                          Paid {contribution.paidAt && `· ${formatDate(contribution.paidAt)}`}
                        </span>
                      ) : isOverdue ? (
                        <span className="inline-flex items-center rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700 dark:bg-red-900/40 dark:text-red-400">
                          Overdue
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/40 dark:text-amber-400">
                          Upcoming
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-slate-600 dark:text-slate-300">
                      {nextUnpaid ? (
                        formatDate(nextUnpaid.dueDate)
                      ) : (
                        <span className="text-emerald-600 dark:text-emerald-400">Fully paid</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-right" onClick={(e) => e.stopPropagation()}>
                      {advanceMemberId === member.id ? (
                        <div className="flex items-center justify-end gap-2">
                          <input
                            type="number"
                            min={1}
                            max={member.contributions.filter((c) => !c.paid).length}
                            value={advanceCount}
                            onChange={(e) =>
                              setAdvanceCount(
                                Math.max(
                                  1,
                                  Math.min(Number(e.target.value), member.contributions.filter((c) => !c.paid).length)
                                )
                              )
                            }
                            className="w-14 rounded-lg border border-slate-300 px-2 py-1 text-xs text-slate-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                          />
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            payment{advanceCount > 1 ? "s" : ""}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleConfirmAdvance(member)}
                            disabled={isAdvancing}
                            className="flex items-center gap-1 text-xs font-medium text-primary hover:underline disabled:opacity-60"
                          >
                            {isAdvancing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                            Confirm
                          </button>
                          <button
                            type="button"
                            onClick={() => setAdvanceMemberId(null)}
                            className="text-xs font-medium text-slate-500 hover:underline dark:text-slate-400"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-3">
                          {contribution.paid ? (
                            <>
                              <button
                                type="button"
                                onClick={() => handleTogglePaid(contribution.id, false)}
                                className="flex items-center gap-1 text-xs font-medium text-slate-500 hover:underline dark:text-slate-400"
                              >
                                <Undo2 className="h-3.5 w-3.5" />
                                Undo
                              </button>
                              {nextUnpaid && (
                                <button
                                  type="button"
                                  onClick={() => openAdvanceChooser(member.id)}
                                  className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                                >
                                  <Zap className="h-3.5 w-3.5" />
                                  Advance payment
                                </button>
                              )}
                            </>
                          ) : isAdvance ? (
                            <button
                              type="button"
                              onClick={() => openAdvanceChooser(member.id)}
                              className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                            >
                              <Zap className="h-3.5 w-3.5" />
                              Advance payment
                            </button>
                          ) : (
                            <>
                              <button
                                type="button"
                                onClick={() => handleTogglePaid(contribution.id, true)}
                                className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                              >
                                <Check className="h-3.5 w-3.5" />
                                Mark paid
                              </button>
                              {member.contributions.filter((c) => !c.paid).length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => openAdvanceChooser(member.id)}
                                  className="text-xs font-medium text-slate-500 hover:underline dark:text-slate-400"
                                >
                                  Advance…
                                </button>
                              )}
                            </>
                          )}
                          <button
                            type="button"
                            onClick={() => handleResetCredentials(member.id)}
                            className="flex items-center gap-1 text-xs font-medium text-slate-500 hover:underline dark:text-slate-400"
                          >
                            <KeyRound className="h-3.5 w-3.5" />
                            Reset login
                          </button>
                          <button
                            type="button"
                            onClick={() => setMemberToRemove(member)}
                            title="Remove"
                            aria-label="Remove"
                            className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <Pagination page={page} pageCount={pageCount} onPageChange={setPage} />

        <div className="mt-3">
          <AddMemberRow
            fundId={fund.id}
            existingEmployeeIds={existingEmployeeIds}
            showEmployeeOption={isBusinessAccount}
            onAdded={handleMemberAdded}
          />
        </div>
      </div>

      {detailMemberId && (
        <MemberDetailModal
          member={fund.members.find((m) => m.id === detailMemberId)!}
          fundName={fund.name}
          defaultCurrency={defaultCurrency}
          onClose={() => setDetailMemberId(null)}
        />
      )}

      {memberToRemove && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl dark:bg-slate-800">
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Remove member?</h2>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              This will remove <span className="font-medium text-slate-700 dark:text-slate-300">{memberName(memberToRemove)}</span>{" "}
              and all of their contribution records from this fund. This can&apos;t be undone.
            </p>
            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setMemberToRemove(null)}
                disabled={isRemoving}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-60 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleRemoveMember(memberToRemove.id)}
                disabled={isRemoving}
                className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isRemoving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
