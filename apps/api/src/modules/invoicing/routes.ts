import type { FastifyPluginAsync } from "fastify";
import { createCustomerSchema, createInvoiceSchema, updateInvoiceStatusSchema } from "./schema";
import { createCustomer, listCustomers, createInvoice, listInvoices, updateInvoiceStatus, HttpError } from "./service";
import { RECEIVABLES_MANAGERS } from "../../lib/roles";

const invoicingRoutes: FastifyPluginAsync = async (app) => {
  app.addHook("preHandler", app.requireRole(...RECEIVABLES_MANAGERS));

  app.get("/customers", async (request, reply) => {
    const customers = await listCustomers(app, request.companyId);
    return reply.send({ customers });
  });

  app.post("/customers", async (request, reply) => {
    const input = createCustomerSchema.parse(request.body);
    const customer = await createCustomer(app, request.companyId, input);
    return reply.send({ customer });
  });

  app.get("/invoices", async (request, reply) => {
    const invoices = await listInvoices(app, request.companyId);
    return reply.send({ invoices });
  });

  app.post("/invoices", async (request, reply) => {
    const input = createInvoiceSchema.parse(request.body);
    try {
      const invoice = await createInvoice(app, request.companyId, input);
      return reply.send({ invoice });
    } catch (err) {
      if (err instanceof HttpError) {
        return reply.code(err.statusCode).send({ error: err.message });
      }
      throw err;
    }
  });

  app.patch("/invoices/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const input = updateInvoiceStatusSchema.parse(request.body);
    try {
      const invoice = await updateInvoiceStatus(app, request.companyId, id, input);
      return reply.send({ invoice });
    } catch (err) {
      if (err instanceof HttpError) {
        return reply.code(err.statusCode).send({ error: err.message });
      }
      throw err;
    }
  });
};

export default invoicingRoutes;
