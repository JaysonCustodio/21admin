import type { FastifyPluginAsync } from "fastify";
import { runPayrollSchema } from "./schema";
import { runPayroll, listPayrollRuns, getEmployeePayslipsForMonth, HttpError } from "./service";
import { PAYROLL_MANAGERS } from "../../lib/roles";

const payrollRoutes: FastifyPluginAsync = async (app) => {
  app.post("/payroll/run", { preHandler: app.requireRole(...PAYROLL_MANAGERS) }, async (request, reply) => {
    const input = runPayrollSchema.parse(request.body);

    try {
      const run = await runPayroll(app, request.companyId, input);
      return reply.send({ run });
    } catch (err) {
      if (err instanceof HttpError) {
        return reply.code(err.statusCode).send({ error: err.message });
      }
      throw err;
    }
  });

  app.get("/payroll/runs", { preHandler: app.requireRole(...PAYROLL_MANAGERS) }, async (request, reply) => {
    const runs = await listPayrollRuns(app, request.companyId);
    return reply.send({ runs });
  });

  app.get("/payroll/me", async (request, reply) => {
    const { year, month } = request.query as { year?: string; month?: string };
    const now = new Date();
    const targetYear = year ? parseInt(year, 10) : now.getFullYear();
    const targetMonth = month ? parseInt(month, 10) : now.getMonth() + 1;

    if (!Number.isInteger(targetYear) || !Number.isInteger(targetMonth) || targetMonth < 1 || targetMonth > 12) {
      return reply.code(400).send({ error: "Invalid year or month." });
    }

    try {
      const { currency, payslips } = await getEmployeePayslipsForMonth(
        app,
        request.userId,
        request.companyId,
        targetYear,
        targetMonth
      );
      return reply.send({ year: targetYear, month: targetMonth, currency, payslips });
    } catch (err) {
      if (err instanceof HttpError) {
        return reply.code(err.statusCode).send({ error: err.message });
      }
      throw err;
    }
  });
};

export default payrollRoutes;
