import fs from "node:fs";
import path from "node:path";
import { pipeline } from "node:stream/promises";
import type { FastifyPluginAsync } from "fastify";
import { createSinkingFundSchema, addMemberSchema, setContributionPaidSchema } from "./schema";
import {
  createSinkingFund,
  listSinkingFunds,
  getSinkingFundBySlug,
  updateSinkingFundQrCode,
  deleteSinkingFund,
  addMember,
  removeMember,
  resetMemberCredentials,
  setContributionPaid,
  HttpError,
} from "./service";
import { CASH_MANAGERS } from "../../lib/roles";
import { SINKING_FUND_QR_DIR } from "../../lib/uploads";
import { imageContainsQrCode } from "../../lib/qr-code";

const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

const sinkingFundsRoutes: FastifyPluginAsync = async (app) => {
  app.addHook("preHandler", app.requireRole(...CASH_MANAGERS));

  app.get("/sinking-funds", async (request, reply) => {
    const funds = await listSinkingFunds(app, request.companyId);
    return reply.send({ funds });
  });

  app.get("/sinking-funds/by-slug/:slug", async (request, reply) => {
    const { slug } = request.params as { slug: string };
    try {
      const fund = await getSinkingFundBySlug(app, request.companyId, slug);
      return reply.send({ fund });
    } catch (err) {
      if (err instanceof HttpError) {
        return reply.code(err.statusCode).send({ error: err.message });
      }
      throw err;
    }
  });

  app.post("/sinking-funds", async (request, reply) => {
    const input = createSinkingFundSchema.parse(request.body);
    try {
      const fund = await createSinkingFund(app, request.companyId, input);
      return reply.send({ fund });
    } catch (err) {
      if (err instanceof HttpError) {
        return reply.code(err.statusCode).send({ error: err.message });
      }
      throw err;
    }
  });

  app.delete("/sinking-funds/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    try {
      await deleteSinkingFund(app, request.companyId, id);
      return reply.send({ ok: true });
    } catch (err) {
      if (err instanceof HttpError) {
        return reply.code(err.statusCode).send({ error: err.message });
      }
      throw err;
    }
  });

  app.post("/sinking-funds/:id/qr-code", async (request, reply) => {
    const { id } = request.params as { id: string };
    try {
      const file = await request.file();
      if (!file) {
        return reply.code(400).send({ error: "No file uploaded." });
      }
      if (!ALLOWED_IMAGE_TYPES.has(file.mimetype)) {
        return reply.code(400).send({ error: "File must be a JPEG, PNG, WebP, or GIF image." });
      }

      const ext = path.extname(file.filename) || ".png";
      const filename = `${id}-${Date.now()}${ext}`;
      const filePath = path.join(SINKING_FUND_QR_DIR, filename);
      await pipeline(file.file, fs.createWriteStream(filePath));

      if (file.file.truncated) {
        await fs.promises.unlink(filePath).catch(() => {});
        return reply.code(400).send({ error: "Image is too large (max 5MB)." });
      }

      const hasQrCode = await imageContainsQrCode(filePath);
      if (!hasQrCode) {
        await fs.promises.unlink(filePath).catch(() => {});
        return reply.code(400).send({ error: "We couldn't find a QR code in that image. Upload a clear photo or screenshot of your payment QR code." });
      }

      const fund = await updateSinkingFundQrCode(app, request.companyId, id, `/uploads/sinking-funds/${filename}`);
      return reply.send({ fund });
    } catch (err) {
      if (err instanceof HttpError) {
        return reply.code(err.statusCode).send({ error: err.message });
      }
      throw err;
    }
  });

  app.post("/sinking-funds/:id/members", async (request, reply) => {
    const { id } = request.params as { id: string };
    const input = addMemberSchema.parse(request.body);
    try {
      const { fund, portalCredentials } = await addMember(app, request.companyId, id, input);
      return reply.send({ fund, portalCredentials });
    } catch (err) {
      if (err instanceof HttpError) {
        return reply.code(err.statusCode).send({ error: err.message });
      }
      throw err;
    }
  });

  app.post("/sinking-funds/:id/members/:memberId/reset-credentials", async (request, reply) => {
    const { id, memberId } = request.params as { id: string; memberId: string };
    try {
      const { fund, portalCredentials } = await resetMemberCredentials(app, request.companyId, id, memberId);
      return reply.send({ fund, portalCredentials });
    } catch (err) {
      if (err instanceof HttpError) {
        return reply.code(err.statusCode).send({ error: err.message });
      }
      throw err;
    }
  });

  app.delete("/sinking-funds/:id/members/:memberId", async (request, reply) => {
    const { id, memberId } = request.params as { id: string; memberId: string };
    try {
      const fund = await removeMember(app, request.companyId, id, memberId);
      return reply.send({ fund });
    } catch (err) {
      if (err instanceof HttpError) {
        return reply.code(err.statusCode).send({ error: err.message });
      }
      throw err;
    }
  });

  app.patch("/sinking-funds/:id/contributions/:contributionId", async (request, reply) => {
    const { id, contributionId } = request.params as { id: string; contributionId: string };
    const input = setContributionPaidSchema.parse(request.body);
    try {
      const fund = await setContributionPaid(app, request.companyId, id, contributionId, input.paid);
      return reply.send({ fund });
    } catch (err) {
      if (err instanceof HttpError) {
        return reply.code(err.statusCode).send({ error: err.message });
      }
      throw err;
    }
  });
};

export default sinkingFundsRoutes;
