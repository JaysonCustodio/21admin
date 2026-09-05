"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Loader2, Plus, X, Search } from "lucide-react";
import type { EmployeeLookup, LoanStatus, LoanWithDetails, SinkingFundWithMembers } from "@business-platform/shared-types";
import { LOAN_STATUSES } from "@business-platform/shared-types";
import { apiClient } from "@/lib/api-client";
import { Pagination } from "@/components/ui/pagination";
import { LoanDetailModal } from "./loan-detail-modal";

const PAGE_SIZE = 10;

const STATUS_STYLES: Record<string, string> = {
  ACTIVE: "bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400",
  PAID_OFF: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400",
  DEFAULTED: "bg-red-50 text-red-700 dark:bg-red-900/40 dark:text-red-400",
};

function formatCurrency(value: number, currency: string): string {
  return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(value);
}

function totalPayableOf(loan: LoanWithDetails): number {
  return Number(loan.principal) * (1 + Number(loan.interestRate) / 100);
}

function balanceOf(loan: LoanWithDetails): number {
  const paid = loan.repayments.reduce((sum, r) => sum + Number(r.amount), 0);
  return Math.max(0, totalPayableOf(loan) - paid);
}

function borrowerName(loan: LoanWithDetails): string {
  if (loan.employee) return loan.employee.fullName;
  if (loan.sinkingFundMember) {
    return loan.sinkingFundMember.employee?.fullName ?? loan.sinkingFundMember.manualName ?? loan.sinkingFundMember.memberCode;
  }
  return loan.manualBorrowerName ?? "—";
}

function fundSourceLabel(loan: LoanWithDetails): string {
  return loan.fundSource === "PERSONAL" ? "Personal" : (loan.sinkingFund?.name ?? "Sinking fund");
}

export function LoansPanel({ defaultCurrency }: { defaultCurrency: string }) {
  const [loans, setLoans] = useState<LoanWithDetails[] | null>(null);
  const [employees, setEmployees] = useState<EmployeeLookup[] | null>(null);
  const [funds, setFunds] = useState<SinkingFundWithMembers[] | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [fundSource, setFundSource] = useState<"PERSONAL" | "SINKING_FUND">("PERSONAL");
  const [sinkingFundId, setSinkingFundId] = useState("");
  const [borrowerType, setBorrowerType] = useState<"EMPLOYEE" | "FUND_MEMBER" | "MANUAL">("EMPLOYEE");
  const [employeeId, setEmployeeId] = useState("");
  const [sinkingFundMemberId, setSinkingFundMemberId] = useState("");
  const [manualBorrowerName, setManualBorrowerName] = useState("");
  const [principal, setPrincipal] = useState("");
  const [interestRate, setInterestRate] = useState("0");
  const [termMonths, setTermMonths] = useState("12");
  const [repaymentAmounts, setRepaymentAmounts] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [selectedLoan, setSelectedLoan] = useState<LoanWithDetails | null>(null);
  const [repaymentConfirm, setRepaymentConfirm] = useState<{ loan: LoanWithDetails; amount: number } | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [createConfirm, setCreateConfirm] = useState<{
    payload: Record<string, unknown>;
    borrowerLabel: string;
    fundLabel: string;
    principal: number;
    interestRate: number;
    termMonths: number;
    totalPayable: number;
  } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<LoanStatus | "ALL">("ALL");
  const [page, setPage] = useState(1);

  function loadLoans() {
    apiClient
      .get<{ loans: LoanWithDetails[] }>("/api/loans")
      .then((data) => {
        setLoans(data.loans);
        setSelectedLoan((prev) => (prev ? (data.loans.find((l) => l.id === prev.id) ?? null) : null));
      })
      .catch(() => setLoans([]));
  }

  useEffect(loadLoans, []);
  useEffect(() => {
    apiClient
      .get<{ employees: EmployeeLookup[] }>("/api/employees/lookup")
      .then((data) => setEmployees(data.employees.filter((e) => e.status === "ACTIVE")))
      .catch(() => setEmployees([]));
    apiClient
      .get<{ funds: SinkingFundWithMembers[] }>("/api/sinking-funds")
      .then((data) => setFunds(data.funds))
      .catch(() => setFunds([]));
  }, []);

  const fundMembers = useMemo(() => {
    if (!funds) return [];
    return funds.flatMap((fund) =>
      fund.members.map((member) => ({
        id: member.id,
        label: `${member.employee?.fullName ?? member.manualName ?? member.memberCode} — ${fund.name}`,
      }))
    );
  }, [funds]);

  const filteredLoans = useMemo(() => {
    if (!loans) return null;
    const query = searchQuery.trim().toLowerCase();

    return loans.filter((loan) => {
      const matchesStatus = statusFilter === "ALL" || loan.status === statusFilter;
      const matchesQuery =
        !query ||
        borrowerName(loan).toLowerCase().includes(query) ||
        fundSourceLabel(loan).toLowerCase().includes(query) ||
        (loan.employee?.employeeCode.toLowerCase().includes(query) ?? false) ||
        (loan.sinkingFundMember?.memberCode.toLowerCase().includes(query) ?? false);
      return matchesStatus && matchesQuery;
    });
  }, [loans, searchQuery, statusFilter]);

  useEffect(() => {
    setPage(1);
  }, [searchQuery, statusFilter]);

  const pageCount = filteredLoans ? Math.max(1, Math.ceil(filteredLoans.length / PAGE_SIZE)) : 1;
  const paginatedLoans = filteredLoans?.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function resetForm() {
    setFundSource("PERSONAL");
    setSinkingFundId("");
    setBorrowerType("EMPLOYEE");
    setEmployeeId("");
    setSinkingFundMemberId("");
    setManualBorrowerName("");
    setPrincipal("");
    setInterestRate("0");
    setTermMonths("12");
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!principal || !termMonths) {
      setError("Fill in all fields.");
      return;
    }
    if (fundSource === "SINKING_FUND" && !sinkingFundId) {
      setError("Select which sinking fund this loan is funded from.");
      return;
    }
    if (borrowerType === "EMPLOYEE" && !employeeId) {
      setError("Select an employee.");
      return;
    }
    if (borrowerType === "FUND_MEMBER" && !sinkingFundMemberId) {
      setError("Select a fund member.");
      return;
    }
    if (borrowerType === "MANUAL" && !manualBorrowerName.trim()) {
      setError("Enter the borrower's name.");
      return;
    }
    setError(null);

    const borrowerLabel =
      borrowerType === "EMPLOYEE"
        ? (() => {
            const employee = employees?.find((e) => e.id === employeeId);
            return employee ? `${employee.fullName} (${employee.employeeCode})` : "—";
          })()
        : borrowerType === "FUND_MEMBER"
          ? (fundMembers.find((m) => m.id === sinkingFundMemberId)?.label ?? "—")
          : manualBorrowerName.trim();

    const fundLabel = fundSource === "PERSONAL" ? "Personal" : (funds?.find((f) => f.id === sinkingFundId)?.name ?? "Sinking fund");
    const principalNum = Number(principal);
    const interestNum = Number(interestRate || 0);

    setCreateConfirm({
      payload: {
        fundSource,
        sinkingFundId: fundSource === "SINKING_FUND" ? sinkingFundId : undefined,
        borrowerType,
        employeeId: borrowerType === "EMPLOYEE" ? employeeId : undefined,
        sinkingFundMemberId: borrowerType === "FUND_MEMBER" ? sinkingFundMemberId : undefined,
        manualBorrowerName: borrowerType === "MANUAL" ? manualBorrowerName.trim() : undefined,
        principal: principalNum,
        interestRate: interestNum,
        termMonths: Number(termMonths),
      },
      borrowerLabel,
      fundLabel,
      principal: principalNum,
      interestRate: interestNum,
      termMonths: Number(termMonths),
      totalPayable: principalNum * (1 + interestNum / 100),
    });
  }

  async function handleConfirmCreate() {
    if (!createConfirm) return;
    setIsSubmitting(true);
    try {
      await apiClient.post("/api/loans", createConfirm.payload);
      resetForm();
      setIsCreating(false);
      setCreateConfirm(null);
      loadLoans();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong creating this loan.");
      setCreateConfirm(null);
    } finally {
      setIsSubmitting(false);
    }
  }

  function openRepaymentConfirm(loan: LoanWithDetails) {
    const amount = repaymentAmounts[loan.id];
    if (!amount || Number(amount) <= 0) return;
    setRepaymentConfirm({ loan, amount: Number(amount) });
  }

  async function handleConfirmRepayment() {
    if (!repaymentConfirm) return;
    setIsRecording(true);
    try {
      await apiClient.post(`/api/loans/${repaymentConfirm.loan.id}/repayments`, { amount: repaymentConfirm.amount });
      setRepaymentAmounts((prev) => ({ ...prev, [repaymentConfirm.loan.id]: "" }));
      setRepaymentConfirm(null);
      loadLoans();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong recording that repayment.");
      setRepaymentConfirm(null);
    } finally {
      setIsRecording(false);
    }
  }

  return (
    <div className="space-y-4">
      {isCreating ? (
        <form
          onSubmit={handleCreate}
          className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">New loan</h3>
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700 dark:hover:text-slate-300"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="loan-fund-source" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Funded from
              </label>
              <select
                id="loan-fund-source"
                value={fundSource}
                onChange={(e) => {
                  setFundSource(e.target.value as "PERSONAL" | "SINKING_FUND");
                  setSinkingFundId("");
                }}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
              >
                <option value="PERSONAL">Personal</option>
                <option value="SINKING_FUND">Sinking fund</option>
              </select>
            </div>
            {fundSource === "SINKING_FUND" && (
              <div>
                <label htmlFor="loan-fund" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Fund
                </label>
                <select
                  id="loan-fund"
                  required
                  value={sinkingFundId}
                  onChange={(e) => setSinkingFundId(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                >
                  <option value="">Select…</option>
                  {funds?.map((fund) => (
                    <option key={fund.id} value={fund.id}>
                      {fund.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="loan-borrower-type" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Borrower
              </label>
              <select
                id="loan-borrower-type"
                value={borrowerType}
                onChange={(e) => {
                  setBorrowerType(e.target.value as "EMPLOYEE" | "FUND_MEMBER" | "MANUAL");
                  setEmployeeId("");
                  setSinkingFundMemberId("");
                  setManualBorrowerName("");
                }}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
              >
                <option value="EMPLOYEE">Employee</option>
                <option value="FUND_MEMBER">Sinking fund member</option>
                <option value="MANUAL">Add manually</option>
              </select>
            </div>
            <div>
              {borrowerType === "EMPLOYEE" && (
                <>
                  <label htmlFor="loan-employee" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Employee
                  </label>
                  <select
                    id="loan-employee"
                    required
                    value={employeeId}
                    onChange={(e) => setEmployeeId(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                  >
                    <option value="">Select…</option>
                    {employees?.map((employee) => (
                      <option key={employee.id} value={employee.id}>
                        {employee.fullName} ({employee.employeeCode})
                      </option>
                    ))}
                  </select>
                </>
              )}
              {borrowerType === "FUND_MEMBER" && (
                <>
                  <label htmlFor="loan-fund-member" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Fund member
                  </label>
                  <select
                    id="loan-fund-member"
                    required
                    value={sinkingFundMemberId}
                    onChange={(e) => setSinkingFundMemberId(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                  >
                    <option value="">Select…</option>
                    {fundMembers.map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.label}
                      </option>
                    ))}
                  </select>
                </>
              )}
              {borrowerType === "MANUAL" && (
                <>
                  <label htmlFor="loan-manual-name" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Borrower name
                  </label>
                  <input
                    id="loan-manual-name"
                    type="text"
                    required
                    value={manualBorrowerName}
                    onChange={(e) => setManualBorrowerName(e.target.value)}
                    placeholder="Full name"
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500"
                  />
                </>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label htmlFor="loan-principal" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Amount
              </label>
              <input
                id="loan-principal"
                type="number"
                min={0}
                required
                value={principal}
                onChange={(e) => setPrincipal(e.target.value)}
                placeholder="10000"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500"
              />
            </div>
            <div>
              <label htmlFor="loan-interest" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Interest (%)
              </label>
              <input
                id="loan-interest"
                type="number"
                min={0}
                max={100}
                step="0.01"
                required
                value={interestRate}
                onChange={(e) => setInterestRate(e.target.value)}
                placeholder="0"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500"
              />
            </div>
            <div>
              <label htmlFor="loan-term" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Term (months)
              </label>
              <input
                id="loan-term"
                type="number"
                min={1}
                required
                value={termMonths}
                onChange={(e) => setTermMonths(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">{error}</p>
          )}

          <button
            type="submit"
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white transition hover:bg-primary/90"
          >
            Review loan
          </button>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => {
            setIsCreating(true);
            setError(null);
          }}
          className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white transition hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          New loan
        </button>
      )}

      {!isCreating && error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">{error}</p>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by borrower, ID, or fund…"
            className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as LoanStatus | "ALL")}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
        >
          <option value="ALL">All statuses</option>
          {LOAN_STATUSES.map((value) => (
            <option key={value} value={value}>
              {value.replace("_", " ")}
            </option>
          ))}
        </select>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs font-medium uppercase tracking-wide text-slate-500 dark:border-slate-700 dark:text-slate-400">
                <th className="px-4 py-2">Borrower</th>
                <th className="px-4 py-2">Funded from</th>
                <th className="px-4 py-2">Principal</th>
                <th className="px-4 py-2">Interest</th>
                <th className="px-4 py-2">Term</th>
                <th className="px-4 py-2">Total payable</th>
                <th className="px-4 py-2">Balance</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2">Record repayment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {loans === null && (
                <tr>
                  <td colSpan={9} className="px-4 py-6 text-center text-slate-400 dark:text-slate-500">
                    Loading…
                  </td>
                </tr>
              )}
              {loans !== null && paginatedLoans?.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-6 text-center text-slate-400 dark:text-slate-500">
                    {loans.length === 0 ? "No loans yet." : "No loans match your filters."}
                  </td>
                </tr>
              )}
              {paginatedLoans?.map((loan) => (
                <tr
                  key={loan.id}
                  onClick={() => setSelectedLoan(loan)}
                  className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50"
                >
                  <td className="px-4 py-2 font-medium text-slate-900 dark:text-slate-100">
                    {borrowerName(loan)}
                    {loan.employee && <span className="ml-1 font-mono text-xs text-slate-400">{loan.employee.employeeCode}</span>}
                    {loan.sinkingFundMember && <span className="ml-1 font-mono text-xs text-slate-400">{loan.sinkingFundMember.memberCode}</span>}
                  </td>
                  <td className="px-4 py-2 text-slate-600 dark:text-slate-300">{fundSourceLabel(loan)}</td>
                  <td className="px-4 py-2 text-slate-600 dark:text-slate-300">{formatCurrency(Number(loan.principal), defaultCurrency)}</td>
                  <td className="px-4 py-2 text-slate-600 dark:text-slate-300">{Number(loan.interestRate)}%</td>
                  <td className="px-4 py-2 text-slate-600 dark:text-slate-300">{loan.termMonths} mo</td>
                  <td className="px-4 py-2 text-slate-600 dark:text-slate-300">{formatCurrency(totalPayableOf(loan), defaultCurrency)}</td>
                  <td className="px-4 py-2 text-slate-600 dark:text-slate-300">{formatCurrency(balanceOf(loan), defaultCurrency)}</td>
                  <td className="px-4 py-2">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[loan.status]}`}>
                      {loan.status.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-4 py-2" onClick={(e) => e.stopPropagation()}>
                    {loan.status === "ACTIVE" && (
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          min={0}
                          value={repaymentAmounts[loan.id] ?? ""}
                          onChange={(e) => setRepaymentAmounts((prev) => ({ ...prev, [loan.id]: e.target.value }))}
                          placeholder="Amount"
                          className="w-24 rounded-lg border border-slate-300 px-2 py-1 text-xs text-slate-900 placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                        />
                        <button
                          type="button"
                          onClick={() => openRepaymentConfirm(loan)}
                          className="rounded-lg border border-slate-300 px-2 py-1 text-xs font-medium text-slate-600 transition hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
                        >
                          Record
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination page={page} pageCount={pageCount} onPageChange={setPage} />
      </div>

      {selectedLoan && (
        <LoanDetailModal loan={selectedLoan} defaultCurrency={defaultCurrency} onClose={() => setSelectedLoan(null)} />
      )}

      {createConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl dark:bg-slate-800">
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Confirm new loan</h2>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <dt className="text-slate-500 dark:text-slate-400">Borrower</dt>
                <dd className="font-medium text-slate-900 dark:text-slate-100">{createConfirm.borrowerLabel}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-slate-500 dark:text-slate-400">Funded from</dt>
                <dd className="font-medium text-slate-900 dark:text-slate-100">{createConfirm.fundLabel}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-slate-500 dark:text-slate-400">Principal</dt>
                <dd className="font-medium text-slate-900 dark:text-slate-100">
                  {formatCurrency(createConfirm.principal, defaultCurrency)}
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-slate-500 dark:text-slate-400">Interest</dt>
                <dd className="font-medium text-slate-900 dark:text-slate-100">{createConfirm.interestRate}%</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-slate-500 dark:text-slate-400">Term</dt>
                <dd className="font-medium text-slate-900 dark:text-slate-100">{createConfirm.termMonths} mo</dd>
              </div>
              <div className="flex items-center justify-between border-t border-slate-100 pt-2 dark:border-slate-700">
                <dt className="text-slate-500 dark:text-slate-400">Total payable</dt>
                <dd className="font-semibold text-slate-900 dark:text-slate-100">
                  {formatCurrency(createConfirm.totalPayable, defaultCurrency)}
                </dd>
              </div>
            </dl>
            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setCreateConfirm(null)}
                disabled={isSubmitting}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-60 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleConfirmCreate}
                disabled={isSubmitting}
                className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}

      {repaymentConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl dark:bg-slate-800">
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Confirm payment</h2>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Record a payment of{" "}
              <span className="font-medium text-slate-700 dark:text-slate-300">
                {formatCurrency(repaymentConfirm.amount, defaultCurrency)}
              </span>{" "}
              from <span className="font-medium text-slate-700 dark:text-slate-300">{borrowerName(repaymentConfirm.loan)}</span>?
            </p>
            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setRepaymentConfirm(null)}
                disabled={isRecording}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-60 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRepayment}
                disabled={isRecording}
                className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isRecording ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
