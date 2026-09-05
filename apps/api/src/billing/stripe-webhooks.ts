import type { FastifyPluginAsync } from "fastify";
import { syncEntitlementsFromSubscription } from "./entitlements-sync";

const stripeWebhooksRoutes: FastifyPluginAsync = async (app) => {
  app.post("/webhooks/stripe", { config: { rawBody: true } }, async (request, reply) => {
    // TODO: verify Stripe signature, parse event
    const event = request.body as { type: string; data: { object: unknown } };

    switch (event.type) {
      case "customer.subscription.updated":
      case "customer.subscription.created":
        await syncEntitlementsFromSubscription(event.data.object);
        break;
      default:
        break;
    }

    return reply.send({ received: true });
  });
};

export default stripeWebhooksRoutes;
