import { NextRequest, NextResponse } from "next/server";
import jwt, { type JwtPayload, type SignOptions } from "jsonwebtoken";
import { ApiError } from "./apiError";

/**
 * Learner sessions — deliberately separate from admin auth:
 *  - different signing secrets, so an admin token can never pass as a user
 *    token (or the other way round),
 *  - both cookies are httpOnly: the browser never sees the JWTs, the site
 *    learns who is signed in from GET /api/v1/users/me.
 *
 * Access token: short-lived (2h). Refresh token: 30 days, rotated on refresh.
 */

export const USER_ACCESS_COOKIE = "bs_uat";
export const USER_REFRESH_COOKIE = "bs_urt";

const ACCESS_TTL_SECONDS = 2 * 60 * 60;
const REFRESH_TTL_SECONDS = 30 * 24 * 60 * 60;

const isProd = process.env.NODE_ENV === "production";

const baseSecret = () => {
  const value = process.env.JWT_SECRET;
  if (!value) throw new Error("Environment variable JWT_SECRET is not set");
  return value;
};
const accessSecret = () => process.env.USER_JWT_SECRET || `${baseSecret()}::user-access`;
const refreshSecret = () =>
  process.env.USER_JWT_REFRESH_SECRET ||
  `${process.env.JWT_REFRESH_SECRET || baseSecret()}::user-refresh`;

export type UserTokenPayload = { id: string; email: string; name: string; typ: "user" };

export const createUserAccessToken = (payload: Omit<UserTokenPayload, "typ">) =>
  jwt.sign({ ...payload, typ: "user" }, accessSecret(), {
    expiresIn: ACCESS_TTL_SECONDS,
  } as SignOptions);

export const createUserRefreshToken = (id: string) =>
  jwt.sign({ id, typ: "user-refresh" }, refreshSecret(), {
    expiresIn: REFRESH_TTL_SECONDS,
  } as SignOptions);

export const verifyUserAccessToken = (token: string): UserTokenPayload => {
  const decoded = jwt.verify(token, accessSecret()) as UserTokenPayload & JwtPayload;
  if (decoded.typ !== "user") throw new Error("Wrong token type");
  return decoded;
};

export const verifyUserRefreshToken = (token: string): { id: string } => {
  const decoded = jwt.verify(token, refreshSecret()) as { id: string; typ: string } & JwtPayload;
  if (decoded.typ !== "user-refresh") throw new Error("Wrong token type");
  return decoded;
};

// ── Cookies ───────────────────────────────────────────────────────────────
const cookieBase = { httpOnly: true, secure: isProd, sameSite: "lax" as const, path: "/" };

export function setUserSession(
  response: NextResponse,
  user: { id: string; email: string; name: string },
) {
  response.cookies.set(USER_ACCESS_COOKIE, createUserAccessToken(user), {
    ...cookieBase,
    maxAge: ACCESS_TTL_SECONDS,
  });
  response.cookies.set(USER_REFRESH_COOKIE, createUserRefreshToken(user.id), {
    ...cookieBase,
    maxAge: REFRESH_TTL_SECONDS,
  });
  return response;
}

export function clearUserSession(response: NextResponse) {
  response.cookies.set(USER_ACCESS_COOKIE, "", { ...cookieBase, maxAge: 0 });
  response.cookies.set(USER_REFRESH_COOKIE, "", { ...cookieBase, maxAge: 0 });
  return response;
}

// ── Guards for route handlers ─────────────────────────────────────────────
export function optionalUser(req: NextRequest): UserTokenPayload | null {
  const token = req.cookies.get(USER_ACCESS_COOKIE)?.value;
  if (!token) return null;
  try {
    return verifyUserAccessToken(token);
  } catch {
    return null;
  }
}

/** Throws 401 — the client then tries POST /users/refresh once and retries. */
export function requireUser(req: NextRequest): UserTokenPayload {
  const user = optionalUser(req);
  if (!user) throw new ApiError(401, "Please sign in to continue");
  return user;
}

/**
 * For Server Component pages (profile, checkout): true when the visitor holds
 * a valid access token OR a valid refresh token (the client refreshes the
 * access token on its first API call).
 */
export function hasUserSession(cookieValue: (name: string) => string | undefined): boolean {
  const access = cookieValue(USER_ACCESS_COOKIE);
  if (access) {
    try {
      verifyUserAccessToken(access);
      return true;
    } catch {
      /* fall through to the refresh token */
    }
  }
  const refresh = cookieValue(USER_REFRESH_COOKIE);
  if (!refresh) return false;
  try {
    verifyUserRefreshToken(refresh);
    return true;
  } catch {
    return false;
  }
}
