"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, RefreshCw } from "lucide-react";
import type { AttendanceEventWithEmployee, AttendanceEventType } from "@business-platform/shared-types";
import { ATTENDANCE_EVENT_TYPES } from "@business-platform/shared-types";
import { apiClient } from "@/lib/api-client";
import { Pagination } from "@/components/ui/pagination";

const EVENT_LABELS: Record<AttendanceEventType, string> = {
  CLOCK_IN: "Clock in",
  CLOCK_OUT: "Clock out",
  BREAK_START: "Break start",
  BREAK_END: "Break end",
};

const EVENT_STYLES: Record<AttendanceEventType, string> = {
  CLOCK_IN: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400",
  CLOCK_OUT: "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300",
  BREAK_START: "bg-amber-50 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400",
  BREAK_END: "bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400",
};

const PAGE_SIZE = 15;

function formatTimestamp(value: string): string {
  return new Date(value).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function isSameDay(isoValue: string, dateInput: string): boolean {
  const eventDate = new Date(isoValue);
  const [year, month, day] = dateInput.split("-").map(Number);
  return eventDate.getFullYear() === year && eventDate.getMonth() + 1 === month && eventDate.getDate() === day;
}

export function AttendanceLog() {
  const [events, setEvents] = useState<AttendanceEventWithEmployee[] | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<AttendanceEventType | "ALL">("ALL");
  const [dateFilter, setDateFilter] = useState("");
  const [page, setPage] = useState(1);
  const [isRefreshing, setIsRefreshing] = useState(false);

  function loadEvents() {
    return apiClient
      .get<{ events: AttendanceEventWithEmployee[] }>("/api/attendance")
      .then((data) => setEvents(data.events))
      .catch(() => setEvents([]));
  }

  useEffect(() => {
    loadEvents();
  }, []);

  async function handleRefresh() {
    setIsRefreshing(true);
    try {
      await loadEvents();
    } finally {
      setIsRefreshing(false);
    }
  }

  const filteredEvents = useMemo(() => {
    if (!events) return null;
    const query = searchQuery.trim().toLowerCase();

    return events.filter((event) => {
      const matchesType = typeFilter === "ALL" || event.type === typeFilter;
      const matchesDate = !dateFilter || isSameDay(event.occurredAt, dateFilter);
      const matchesQuery =
        !query ||
        event.employee.fullName.toLowerCase().includes(query) ||
        event.employee.employeeCode.toLowerCase().includes(query);
      return matchesType && matchesDate && matchesQuery;
    });
  }, [events, searchQuery, typeFilter, dateFilter]);

  useEffect(() => {
    setPage(1);
  }, [searchQuery, typeFilter, dateFilter]);

  const pageCount = filteredEvents ? Math.max(1, Math.ceil(filteredEvents.length / PAGE_SIZE)) : 1;
  const paginatedEvents = filteredEvents?.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by employee name or ID…"
            className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500"
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as AttendanceEventType | "ALL")}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
        >
          <option value="ALL">All events</option>
          {ATTENDANCE_EVENT_TYPES.map((value) => (
            <option key={value} value={value}>
              {EVENT_LABELS[value]}
            </option>
          ))}
        </select>
        <input
          type="date"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
        />
        {dateFilter && (
          <button
            type="button"
            onClick={() => setDateFilter("")}
            className="text-sm font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
          >
            Clear date
          </button>
        )}
        <button
          type="button"
          onClick={handleRefresh}
          disabled={isRefreshing}
          aria-label="Refresh"
          title="Refresh"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-300 text-slate-600 transition hover:bg-slate-50 disabled:opacity-60 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
        </button>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs font-medium uppercase tracking-wide text-slate-500 dark:border-slate-700 dark:text-slate-400">
                <th className="px-4 py-2">Employee ID</th>
                <th className="px-4 py-2">Employee</th>
                <th className="px-4 py-2">Event</th>
                <th className="px-4 py-2">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {events === null && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-slate-400 dark:text-slate-500">
                    Loading…
                  </td>
                </tr>
              )}
              {events !== null && paginatedEvents?.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-slate-400 dark:text-slate-500">
                    {events.length === 0 ? "No clock activity yet." : "No events match your filters."}
                  </td>
                </tr>
              )}
              {paginatedEvents?.map((event) => (
                <tr key={event.id}>
                  <td className="px-4 py-2 font-mono text-xs text-slate-500 dark:text-slate-400">
                    {event.employee.employeeCode}
                  </td>
                  <td className="px-4 py-2 font-medium text-slate-900 dark:text-slate-100">{event.employee.fullName}</td>
                  <td className="px-4 py-2">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${EVENT_STYLES[event.type]}`}
                    >
                      {EVENT_LABELS[event.type]}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-slate-500 dark:text-slate-400">{formatTimestamp(event.occurredAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination page={page} pageCount={pageCount} onPageChange={setPage} />
      </div>
    </div>
  );
}
