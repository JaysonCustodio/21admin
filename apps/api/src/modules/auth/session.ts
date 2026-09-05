import jwt from "jsonwebtoken";
import type { FastifyReply } from "fastify";
import { env } from "../../env";

export const SESSION_COOKIE_NAME = "session";

const DAY_MS = 24 * 60 * 60 * 1000;
const REMEMBER_ME_MAX_AGE = 30 * DAY_MS;

export interface SessionPayload {
  sub: string; // userId
  companyId: string;
}

export function signSessionToken(payload: SessionPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: "30d" });
}

export function verifySessionToken(token: string): SessionPayload {
  return jwt.verify(token, env.JWT_SECRET) as SessionPayload;
}

export function setSessionCookie(reply: FastifyReply, token: string, rememberMe: boolean) {
  reply.setCookie(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    // web and api are separate origins in production (different Render
    // subdomains), so the cookie must be SameSite=None to survive cross-origin
    // fetch calls — that requires Secure, which is only true once we're on HTTPS
    sameSite: env.NODE_ENV === "production" ? "none" : "lax",
    secure: env.NODE_ENV === "production",
    path: "/",
    ...(rememberMe ? { maxAge: REMEMBER_ME_MAX_AGE / 1000 } : {}),
  });
}

export function clearSessionCookie(reply: FastifyReply) {
  reply.clearCookie(SESSION_COOKIE_NAME, { path: "/" });
}
