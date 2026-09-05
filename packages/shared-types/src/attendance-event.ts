export const ATTENDANCE_EVENT_TYPES = ["CLOCK_IN", "CLOCK_OUT", "BREAK_START", "BREAK_END"] as const;

export type AttendanceEventType = (typeof ATTENDANCE_EVENT_TYPES)[number];

export type ClockStatus = "OUT" | "IN" | "ON_BREAK";

export interface AttendanceEvent {
  id: string;
  companyId: string;
  employeeId: string;
  type: AttendanceEventType;
  occurredAt: string;
}

export interface AttendanceEventWithEmployee extends AttendanceEvent {
  employee: {
    fullName: string;
    employeeCode: string;
  };
}
