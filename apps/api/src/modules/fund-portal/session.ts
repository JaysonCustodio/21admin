import jwt from "jsonwebtoken";
import type { FastifyReply } from "fastify";
import { env } from "../../env";

export const FUND_SESSION_COOKIE_NAME = "fund_session";

const DAY_MS = 24 * 60 * 60 * 1000;
const FUND_SESSION_MAX_AGE = 30 * DAY_MS;

export interface FundSessionPayload {
  sub: string; // SinkingFundMember id
  fundId: string;
}

export function signFundSessionToken(payload: FundSessionPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: "30d" });
}

export function verifyFundSessionToken(token: string): FundSessionPayload {
  return jwt.verify(token, env.JWT_SECRET) as FundSessionPayload;
}

export function setFundSessionCookie(reply: FastifyReply, token: string) {
  reply.setCookie(FUND_SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: env.NODE_ENV === "production",
    path: "/",
    maxAge: FUND_SESSION_MAX_AGE / 1000,
  });
}

export function clearFundSessionCookie(reply: FastifyReply) {
  reply.clearCookie(FUND_SESSION_COOKIE_NAME, { path: "/" });
}
