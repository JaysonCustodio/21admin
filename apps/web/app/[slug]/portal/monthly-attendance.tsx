"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";
import type { AttendanceEvent, AttendanceEventType } from "@business-platform/shared-types";
import { apiClient } from "@/lib/api-client";

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

function monthLabel(year: number, month: number): string {
  return new Date(year, month - 1, 1).toLocaleDateString(undefined, { month: "long", year: "numeric" });
}

function dayLabel(value: string): string {
  return new Date(value).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}

function timeLabel(value: string): string {
  return new Date(value).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

function dayKey(value: string): string {
  const d = new Date(value);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

export function MonthlyAttendance() {
  const now = useMemo(() => new Date(), []);
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [events, setEvents] = useState<AttendanceEvent[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  function loadEvents() {
    setError(null);
    return apiClient
      .get<{ events: AttendanceEvent[] }>(`/api/attendance/me/month?year=${year}&month=${month}`)
      .then((data) => setEvents(data.events))
      .catch(() => setError("Couldn't load your attendance history."));
  }

  useEffect(() => {
    setEvents(null);
    loadEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year, month]);

  async function handleRefresh() {
    setIsRefreshing(true);
    try {
      await loadEvents();
    } finally {
      setIsRefreshing(false);
    }
  }

  function goToPreviousMonth() {
    if (month === 1) {
      setYear((y) => y - 1);
      setMonth(12);
    } else {
      setMonth((m) => m - 1);
    }
  }

  function goToNextMonth() {
    if (month === 12) {
      setYear((y) => y + 1);
      setMonth(1);
    } else {
      setMonth((m) => m + 1);
    }
  }

  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth() + 1;

  const groupedByDay = useMemo(() => {
    if (!events) return [];
    const groups = new Map<string, { date: string; events: AttendanceEvent[] }>();
    for (const event of events) {
      const key = dayKey(event.occurredAt);
      const group = groups.get(key);
      if (group) {
        group.events.push(event);
      } else {
        groups.set(key, { date: event.occurredAt, events: [event] });
      }
    }
    return Array.from(groups.entries())
      .map(([key, value]) => ({ key, ...value }))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [events]);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Attendance history</h2>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isRefreshing}
            aria-label="Refresh"
            title="Refresh"
            className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 disabled:opacity-60 dark:text-slate-400 dark:hover:bg-slate-700"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
          </button>
          <button
            type="button"
            onClick={goToPreviousMonth}
            aria-label="Previous month"
            className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="min-w-[9rem] text-center text-sm font-medium text-slate-700 dark:text-slate-300">
            {monthLabel(year, month)}
          </span>
          <button
            type="button"
            onClick={goToNextMonth}
            disabled={isCurrentMonth}
            aria-label="Next month"
            className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 dark:text-slate-400 dark:hover:bg-slate-700"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {error && (
        <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </p>
      )}

      <div className="mt-3 space-y-3">
        {events === null && !error && (
          <p className="py-6 text-center text-sm text-slate-400 dark:text-slate-500">Loading…</p>
        )}
        {events !== null && groupedByDay.length === 0 && (
          <p className="py-6 text-center text-sm text-slate-400 dark:text-slate-500">No attendance recorded this month.</p>
        )}
        {groupedByDay.map((day) => (
          <div key={day.key}>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">
              {dayLabel(day.date)}
            </p>
            <div className="mt-1 space-y-1">
              {day.events.map((event) => (
                <div key={event.id} className="flex items-center justify-between text-sm">
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${EVENT_STYLES[event.type]}`}
                  >
                    {EVENT_LABELS[event.type]}
                  </span>
                  <span className="font-mono text-slate-500 dark:text-slate-400">{timeLabel(event.occurredAt)}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
