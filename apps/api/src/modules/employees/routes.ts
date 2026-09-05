import path from "node:path";
import type { FastifyInstance, FastifyPluginAsync } from "fastify";
import { createEmployeeSchema, updateEmployeeSchema } from "./schema";
import {
  listEmployees,
  getEmployee,
  createEmployee,
  updateEmployee,
  updateEmployeePhoto,
  HttpError,
  type PortalCredentials,
} from "./service";
import { env } from "../../env";
import { saveUploadedFile } from "../../lib/storage";
import { EMPLOYEE_MANAGERS, EMPLOYEE_SENSITIVE_FIELDS, ALL_STAFF } from "../../lib/roles";

const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

async function buildPortalUrl(app: FastifyInstance, companyId: string): Promise<string | null> {
  const company = await app.prisma.company.findUnique({ where: { id: companyId } });
  return company?.slug ? `${env.WEB_APP_URL}/${company.slug}/login` : null;
}

function withPortalUrl(credentials: PortalCredentials | null, portalUrl: string | null) {
  return credentials ? { ...credentials, portalUrl } : null;
}

// HR_ASSISTANT can manage the directory but not salary/bank info
function stripSensitiveFieldsForRole<T extends Record<string, unknown>>(input: T, role: string): T {
  if (role !== "HR_ASSISTANT") return input;
  const sanitized = { ...input };
  for (const field of EMPLOYEE_SENSITIVE_FIELDS) {
    delete sanitized[field];
  }
  return sanitized;
}

const employeesRoutes: FastifyPluginAsync = async (app) => {
  // minimal name/code lookup shared with non-HR modules that reference an
  // employee (e.g. picking who a loan is for) without exposing the full directory
  app.get("/employees/lookup", { preHandler: app.requireRole(...ALL_STAFF) }, async (request, reply) => {
    const employees = await listEmployees(app, request.companyId);
    return reply.send({
      employees: employees.map((employee) => ({
        id: employee.id,
        fullName: employee.fullName,
        employeeCode: employee.employeeCode,
        status: employee.status,
      })),
    });
  });

  app.get("/employees", { preHandler: app.requireRole(...EMPLOYEE_MANAGERS) }, async (request, reply) => {
    const employees = await listEmployees(app, request.companyId);
    return reply.send({ employees });
  });

  app.get("/employees/:id", { preHandler: app.requireRole(...EMPLOYEE_MANAGERS) }, async (request, reply) => {
    const { id } = request.params as { id: string };

    try {
      const employee = await getEmployee(app, request.companyId, id);
      return reply.send({ employee });
    } catch (err) {
      if (err instanceof HttpError) {
        return reply.code(err.statusCode).send({ error: err.message });
      }
      throw err;
    }
  });

  app.post("/employees", { preHandler: app.requireRole(...EMPLOYEE_MANAGERS) }, async (request, reply) => {
    const input = stripSensitiveFieldsForRole(createEmployeeSchema.parse(request.body), request.userRole);

    try {
      const { employee, portalCredentials } = await createEmployee(app, request.companyId, input);
      const portalUrl = portalCredentials ? await buildPortalUrl(app, request.companyId) : null;

      return reply.send({ employee, portalCredentials: withPortalUrl(portalCredentials, portalUrl) });
    } catch (err) {
      if (err instanceof HttpError) {
        return reply.code(err.statusCode).send({ error: err.message });
      }
      throw err;
    }
  });

  app.patch("/employees/:id", { preHandler: app.requireRole(...EMPLOYEE_MANAGERS) }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const input = stripSensitiveFieldsForRole(updateEmployeeSchema.parse(request.body), request.userRole);

    try {
      const { employee, portalCredentials } = await updateEmployee(app, request.companyId, id, input);
      const portalUrl = portalCredentials ? await buildPortalUrl(app, request.companyId) : null;

      return reply.send({ employee, portalCredentials: withPortalUrl(portalCredentials, portalUrl) });
    } catch (err) {
      if (err instanceof HttpError) {
        return reply.code(err.statusCode).send({ error: err.message });
      }
      throw err;
    }
  });

  app.post("/employees/:id/photo", { preHandler: app.requireRole(...EMPLOYEE_MANAGERS) }, async (request, reply) => {
    const { id } = request.params as { id: string };

    try {
      const employee = await getEmployee(app, request.companyId, id);

      const file = await request.file();
      if (!file) {
        return reply.code(400).send({ error: "No file uploaded." });
      }
      if (!ALLOWED_IMAGE_TYPES.has(file.mimetype)) {
        return reply.code(400).send({ error: "File must be a JPEG, PNG, WebP, or GIF image." });
      }

      const ext = path.extname(file.filename) || ".jpg";
      const filename = `${employee.id}-${Date.now()}${ext}`;
      const { url, truncated } = await saveUploadedFile(file, "employees", filename);
      if (truncated || !url) {
        return reply.code(400).send({ error: "Image is too large (max 5MB)." });
      }

      const updated = await updateEmployeePhoto(app, employee.id, url);
      return reply.send({ employee: updated });
    } catch (err) {
      if (err instanceof HttpError) {
        return reply.code(err.statusCode).send({ error: err.message });
      }
      throw err;
    }
  });
};

export default employeesRoutes;
