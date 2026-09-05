import type { FastifyPluginAsync } from "fastify";
import { createLoanSchema, recordRepaymentSchema } from "./schema";
import { createLoan, listLoans, recordRepayment, HttpError } from "./service";
import { CASH_MANAGERS } from "../../lib/roles";

const loansRoutes: FastifyPluginAsync = async (app) => {
  app.addHook("preHandler", app.requireRole(...CASH_MANAGERS));

  app.get("/loans", async (request, reply) => {
    const loans = await listLoans(app, request.companyId);
    return reply.send({ loans });
  });

  app.post("/loans", async (request, reply) => {
    const input = createLoanSchema.parse(request.body);
    try {
      const loan = await createLoan(app, request.companyId, input);
      return reply.send({ loan });
    } catch (err) {
      if (err instanceof HttpError) {
        return reply.code(err.statusCode).send({ error: err.message });
      }
      throw err;
    }
  });

  app.post("/loans/:id/repayments", async (request, reply) => {
    const { id } = request.params as { id: string };
    const input = recordRepaymentSchema.parse(request.body);
    try {
      const loan = await recordRepayment(app, request.companyId, id, input);
      return reply.send({ loan });
    } catch (err) {
      if (err instanceof HttpError) {
        return reply.code(err.statusCode).send({ error: err.message });
      }
      throw err;
    }
  });
};

export default loansRoutes;
