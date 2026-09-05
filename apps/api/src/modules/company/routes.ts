import path from "node:path";
import type { FastifyPluginAsync } from "fastify";
import { updateCompanySchema } from "./schema";
import { getCompany, updateCompany, updateCompanyLogo, HttpError } from "./service";
import { saveUploadedFile } from "../../lib/storage";
import { TEAM_MANAGERS } from "../../lib/roles";

const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml"]);

const companyRoutes: FastifyPluginAsync = async (app) => {
  app.addHook("preHandler", app.requireRole(...TEAM_MANAGERS));

  app.get("/company", async (request, reply) => {
    try {
      const company = await getCompany(app, request.companyId);
      return reply.send({ company });
    } catch (err) {
      if (err instanceof HttpError) {
        return reply.code(err.statusCode).send({ error: err.message });
      }
      throw err;
    }
  });

  app.patch("/company", async (request, reply) => {
    const input = updateCompanySchema.parse(request.body);

    try {
      const company = await updateCompany(app, request.companyId, input);
      return reply.send({ company });
    } catch (err) {
      if (err instanceof HttpError) {
        return reply.code(err.statusCode).send({ error: err.message });
      }
      throw err;
    }
  });

  app.post("/company/logo", async (request, reply) => {
    try {
      const file = await request.file();
      if (!file) {
        return reply.code(400).send({ error: "No file uploaded." });
      }
      if (!ALLOWED_IMAGE_TYPES.has(file.mimetype)) {
        return reply.code(400).send({ error: "File must be a JPEG, PNG, WebP, GIF, or SVG image." });
      }

      const ext = path.extname(file.filename) || ".png";
      const filename = `${request.companyId}-${Date.now()}${ext}`;
      const { url, truncated } = await saveUploadedFile(file, "companies", filename);
      if (truncated || !url) {
        return reply.code(400).send({ error: "Image is too large (max 5MB)." });
      }

      const company = await updateCompanyLogo(app, request.companyId, url);
      return reply.send({ company });
    } catch (err) {
      if (err instanceof HttpError) {
        return reply.code(err.statusCode).send({ error: err.message });
      }
      throw err;
    }
  });
};

export default companyRoutes;
