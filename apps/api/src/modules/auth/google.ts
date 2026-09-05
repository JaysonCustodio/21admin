import type { FastifyPluginAsync } from "fastify";
import fastifyOauth2, { type OAuth2Namespace } from "@fastify/oauth2";
import { env } from "../../env";
import { findOrCreateFromGoogle } from "./service";
import { signSessionToken, setSessionCookie } from "./session";

declare module "fastify" {
  interface FastifyInstance {
    googleOAuth2: OAuth2Namespace;
  }
}

const googleAuthRoutes: FastifyPluginAsync = async (app) => {
  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) {
    app.log.warn("Google OAuth is not configured (missing GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET)");
    return;
  }

  await app.register(fastifyOauth2, {
    name: "googleOAuth2",
    scope: ["openid", "profile", "email"],
    credentials: {
      client: {
        id: env.GOOGLE_CLIENT_ID,
        secret: env.GOOGLE_CLIENT_SECRET,
      },
      auth: fastifyOauth2.GOOGLE_CONFIGURATION,
    },
    startRedirectPath: "/google",
    callbackUri: `${env.API_URL}/api/auth/google/callback`,
  });

  app.get("/google/callback", async (request, reply) => {
    const { token } = await app.googleOAuth2.getAccessTokenFromAuthorizationCodeFlow(request);

    const userInfoResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${token.access_token}` },
    });

    if (!userInfoResponse.ok) {
      return reply.code(502).send({ error: "Failed to fetch Google profile" });
    }

    const profile = (await userInfoResponse.json()) as { id: string; email: string; name: string };
    const user = await findOrCreateFromGoogle(app, profile);

    const sessionToken = signSessionToken({ sub: user.id, companyId: user.companyId });
    setSessionCookie(reply, sessionToken, true);

    return reply.redirect(`${env.WEB_APP_URL}/dashboard`);
  });
};

export default googleAuthRoutes;
