import { NextRequest } from "next/server";
import { verifyAccessToken, type AccessTokenPayload } from "./jwtHelpers";
import { ApiError } from "./apiError";
import type { AdminRole } from "./jwtHelpers";

export type { AdminRole };

/** Roles allowed to mutate site content. */
export const CONTENT_EDITORS: AdminRole[] = ["superadmin", "admin", "editor"];
/** Roles allowed to read the admin panel at all. */
export const PANEL_VIEWERS: AdminRole[] = [
  "superadmin",
  "admin",
  "editor",
  "viewOnly",
];
/** Roles allowed to manage other admins. */
export const ADMIN_MANAGERS: AdminRole[] = ["superadmin"];

const extractToken = (req: NextRequest): string | null => {
  const header = req.headers.get("authorization");
  if (header?.startsWith("Bearer ")) return header.slice(7).trim();
  return (
    req.cookies.get("access_token")?.value ??
    req.cookies.get("token")?.value ??
    null
  );
};

/**
 * Throws an ApiError when the caller is missing, invalid, or under-privileged.
 * Use inside `route()` so the wrapper turns it into a JSON response.
 */
export function requireAuth(
  req: NextRequest,
  allowedRoles: AdminRole[] = PANEL_VIEWERS,
): AccessTokenPayload {
  const token = extractToken(req);
  if (!token) throw new ApiError(401, "Unauthorized: no credentials provided");

  let decoded: AccessTokenPayload;
  try {
    decoded = verifyAccessToken(token);
  } catch {
    throw new ApiError(401, "Unauthorized: session expired or invalid");
  }

  if (!allowedRoles.includes(decoded.role)) {
    throw new ApiError(403, "Forbidden: your role cannot perform this action");
  }

  return decoded;
}

/** Non-throwing variant — returns null when unauthenticated. */
export function optionalAuth(req: NextRequest): AccessTokenPayload | null {
  const token = extractToken(req);
  if (!token) return null;
  try {
    return verifyAccessToken(token);
  } catch {
    return null;
  }
}

/**
 * Legacy result-object API, kept so existing call sites keep compiling.
 * Prefer `requireAuth` in new code.
 */
export function verifyTokenAndRole(
  req: NextRequest,
  allowedRoles: string[],
): { success: boolean; message: string; user?: AccessTokenPayload } {
  try {
    const user = requireAuth(req, allowedRoles as AdminRole[]);
    return { success: true, message: "OK", user };
  } catch (err) {
    return {
      success: false,
      message: err instanceof ApiError ? err.message : "Unauthorized",
    };
  }
}
