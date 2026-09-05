import type { FastifyInstance } from "fastify";
import type { AttendanceEvent, AttendanceEventType, Employee, Prisma } from "@business-platform/db";

type AttendanceEventWithEmployee = Prisma.AttendanceEventGetPayload<{
  include: { employee: { select: { fullName: true; employeeCode: true } } };
}>;

export class HttpError extends Error {
  constructor(
    message: string,
    public statusCode: number
  ) {
    super(message);
  }
}

export type ClockStatus = "OUT" | "IN" | "ON_BREAK";

export async function getEmployeeForUser(app: FastifyInstance, userId: string, companyId: string): Promise<Employee> {
  const employee = await app.prisma.employee.findUnique({ where: { userId } });
  if (!employee || employee.companyId !== companyId) {
    throw new HttpError("No employee record is linked to this account.", 403);
  }
  return employee;
}

async function getLastEvent(app: FastifyInstance, employeeId: string) {
  return app.prisma.attendanceEvent.findFirst({
    where: { employeeId },
    orderBy: { occurredAt: "desc" },
  });
}

export async function getClockStatus(app: FastifyInstance, employeeId: string): Promise<ClockStatus> {
  const last = await getLastEvent(app, employeeId);
  if (!last || last.type === "CLOCK_OUT") return "OUT";
  if (last.type === "BREAK_START") return "ON_BREAK";
  return "IN";
}

const ALLOWED_FROM: Record<AttendanceEventType, ClockStatus[]> = {
  CLOCK_IN: ["OUT"],
  CLOCK_OUT: ["IN", "ON_BREAK"],
  BREAK_START: ["IN"],
  BREAK_END: ["ON_BREAK"],
};

const ACTION_LABEL: Record<AttendanceEventType, string> = {
  CLOCK_IN: "clock in",
  CLOCK_OUT: "clock out",
  BREAK_START: "start a break",
  BREAK_END: "end your break",
};

export async function recordEvent(
  app: FastifyInstance,
  companyId: string,
  employeeId: string,
  type: AttendanceEventType
): Promise<AttendanceEvent> {
  const status = await getClockStatus(app, employeeId);
  if (!ALLOWED_FROM[type].includes(status)) {
    throw new HttpError(`Cannot ${ACTION_LABEL[type]} right now.`, 409);
  }
  return app.prisma.attendanceEvent.create({ data: { companyId, employeeId, type } });
}

export function getTodayEvents(app: FastifyInstance, employeeId: string): Promise<AttendanceEvent[]> {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  return app.prisma.attendanceEvent.findMany({
    where: { employeeId, occurredAt: { gte: startOfDay } },
    orderBy: { occurredAt: "asc" },
  });
}

export function getMonthEvents(
  app: FastifyInstance,
  employeeId: string,
  year: number,
  month: number
): Promise<AttendanceEvent[]> {
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 1);

  return app.prisma.attendanceEvent.findMany({
    where: { employeeId, occurredAt: { gte: start, lt: end } },
    orderBy: { occurredAt: "asc" },
  });
}

export function listCompanyEvents(
  app: FastifyInstance,
  companyId: string,
  limit = 200
): Promise<AttendanceEventWithEmployee[]> {
  return app.prisma.attendanceEvent.findMany({
    where: { companyId },
    orderBy: { occurredAt: "desc" },
    take: limit,
    include: { employee: { select: { fullName: true, employeeCode: true } } },
  });
}
