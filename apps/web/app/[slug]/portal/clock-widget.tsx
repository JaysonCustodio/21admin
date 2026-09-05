"use client";

import { useEffect, useState } from "react";
import { LogIn, LogOut, Coffee, Play } from "lucide-react";
import type { AttendanceEvent, ClockStatus, AttendanceEventType } from "@business-platform/shared-types";
import { apiClient } from "@/lib/api-client";

const EVENT_LABELS: Record<AttendanceEventType, string> = {
  CLOCK_IN: "Clocked in",
  CLOCK_OUT: "Clocked out",
  BREAK_START: "Break started",
  BREAK_END: "Break ended",
};

const STATUS_LABELS: Record<ClockStatus, string> = {
  OUT: "Clocked out",
  IN: "Clocked in",
  ON_BREAK: "On break",
};

const STATUS_STYLES: Record<ClockStatus, string> = {
  OUT: "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300",
  IN: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400",
  ON_BREAK: "bg-amber-50 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400",
};

function formatTime(value: string): string {
  return new Date(value).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

export function ClockWidget() {
  const [status, setStatus] = useState<ClockStatus | null>(null);
  const [events, setEvents] = useState<AttendanceEvent[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function loadStatus() {
    apiClient
      .get<{ status: ClockStatus; events: AttendanceEvent[] }>("/api/attendance/me")
      .then((data) => {
        setStatus(data.status);
        setEvents(data.events);
      })
      .catch(() => setError("Couldn't load your attendance status."));
  }

  useEffect(loadStatus, []);

  async function performAction(path: string) {
    setError(null);
    setIsSubmitting(true);
    try {
      const { event, status: newStatus } = await apiClient.post<{ event: AttendanceEvent; status: ClockStatus }>(
        `/api/attendance/${path}`,
        {}
      );
      setStatus(newStatus);
      setEvents((prev) => [...prev, event]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Time clock</h2>
        {status && (
          <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLES[status]}`}>
            {STATUS_LABELS[status]}
          </span>
        )}
      </div>

      {error && (
        <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </p>
      )}

      <div className="mt-3 flex flex-wrap gap-2">
        {status === "OUT" && (
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => performAction("clock-in")}
            className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-white transition hover:bg-primary/90 disabled:opacity-60"
          >
            <LogIn className="h-4 w-4" />
            Clock in
          </button>
        )}

        {status === "IN" && (
          <>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => performAction("break-start")}
              className="flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-60 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              <Coffee className="h-4 w-4" />
              Start break
            </button>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => performAction("clock-out")}
              className="flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-60 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              <LogOut className="h-4 w-4" />
              Clock out
            </button>
          </>
        )}

        {status === "ON_BREAK" && (
          <>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => performAction("break-end")}
              className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-white transition hover:bg-primary/90 disabled:opacity-60"
            >
              <Play className="h-4 w-4" />
              End break
            </button>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => performAction("clock-out")}
              className="flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-60 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              <LogOut className="h-4 w-4" />
              Clock out
            </button>
          </>
        )}
      </div>

      {events.length > 0 && (
        <div className="mt-4 space-y-1.5 border-t border-slate-100 pt-3 dark:border-slate-700">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">Today</p>
          {events.map((event) => (
            <div key={event.id} className="flex justify-between text-sm">
              <span className="text-slate-600 dark:text-slate-300">{EVENT_LABELS[event.type]}</span>
              <span className="font-mono text-slate-500 dark:text-slate-400">{formatTime(event.occurredAt)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
