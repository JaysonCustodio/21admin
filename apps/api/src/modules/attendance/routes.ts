import type { FastifyPluginAsync, FastifyReply, FastifyRequest } from "fastify";
import type { AttendanceEventType } from "@business-platform/db";
import { EMPLOYEE_MANAGERS } from "../../lib/roles";
import {
  getEmployeeForUser,
  getClockStatus,
  getTodayEvents,
  getMonthEvents,
  recordEvent,
  listCompanyEvents,
  HttpError,
} from "./service";

const attendanceRoutes: FastifyPluginAsync = async (app) => {
  app.get("/attendance/me", async (request, reply) => {
    try {
      const employee = await getEmployeeForUser(app, request.userId, request.companyId);
      const [status, events] = await Promise.all([
        getClockStatus(app, employee.id),
        getTodayEvents(app, employee.id),
      ]);
      return reply.send({ status, events });
    } catch (err) {
      if (err instanceof HttpError) {
        return reply.code(err.statusCode).send({ error: err.message });
      }
      throw err;
    }
  });

  app.get("/attendance/me/month", async (request, reply) => {
    const { year, month } = request.query as { year?: string; month?: string };
    const now = new Date();
    const targetYear = year ? parseInt(year, 10) : now.getFullYear();
    const targetMonth = month ? parseInt(month, 10) : now.getMonth() + 1;

    if (!Number.isInteger(targetYear) || !Number.isInteger(targetMonth) || targetMonth < 1 || targetMonth > 12) {
      return reply.code(400).send({ error: "Invalid year or month." });
    }

    try {
      const employee = await getEmployeeForUser(app, request.userId, request.companyId);
      const events = await getMonthEvents(app, employee.id, targetYear, targetMonth);
      return reply.send({ year: targetYear, month: targetMonth, events });
    } catch (err) {
      if (err instanceof HttpError) {
        return reply.code(err.statusCode).send({ error: err.message });
      }
      throw err;
    }
  });

  function clockAction(type: AttendanceEventType) {
    return async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const employee = await getEmployeeForUser(app, request.userId, request.companyId);
        const event = await recordEvent(app, request.companyId, employee.id, type);
        const status = await getClockStatus(app, employee.id);
        return reply.send({ event, status });
      } catch (err) {
        if (err instanceof HttpError) {
          return reply.code(err.statusCode).send({ error: err.message });
        }
        throw err;
      }
    };
  }

  app.post("/attendance/clock-in", clockAction("CLOCK_IN"));
  app.post("/attendance/clock-out", clockAction("CLOCK_OUT"));
  app.post("/attendance/break-start", clockAction("BREAK_START"));
  app.post("/attendance/break-end", clockAction("BREAK_END"));

  app.get("/attendance", { preHandler: app.requireRole(...EMPLOYEE_MANAGERS) }, async (request, reply) => {
    const events = await listCompanyEvents(app, request.companyId);
    return reply.send({ events });
  });
};

export default attendanceRoutes;
