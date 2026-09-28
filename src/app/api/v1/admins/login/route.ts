import { NextRequest } from "next/server";
import { route, readJson } from "@/app/lib/catchAsync";
import { sendResponse } from "@/app/lib/sendResponse";
import { getClientIp } from "@/app/lib/getClientIp";
import { loginAdminService, needsBootstrap } from "@/app/services/admin.service";
import type { ILoginPayload } from "@/app/types";

export const dynamic = "force-dynamic";

const isProd = process.env.NODE_ENV === "production";

// ── POST /api/v1/admins/login ────────────────────────────────────────────
export const POST = route(async (req: NextRequest) => {
  const body = await readJson<ILoginPayload>(req);

  const result = await loginAdminService({
    admin_email: body.admin_email,
    admin_password: body.admin_password,
    sendingDeviceIp: getClientIp(req),
  });

  const response = sendResponse({
    statusCode: 200,
    success: true,
    message: `Welcome back, ${result.admin.admin_name}`,
    data: { access_token: result.access_token, admin: result.admin },
  });

  // Access token also lands in a cookie so server-side route handlers can
  // authorise without the client re-attaching the header. It stays readable
  // by JS because the admin SPA decodes it for role-aware navigation.
  response.cookies.set("access_token", result.access_token, {
    httpOnly: false,
    secure: isProd,
    sameSite: "lax",
    maxAge: 24 * 60 * 60,
    path: "/",
  });

  // The refresh token is httpOnly — it never needs to be readable by scripts.
  response.cookies.set("refreshToken", result.refresh_token, {
    httpOnly: true,
    secure: isProd,
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60,
    path: "/",
  });

  return response;
});

// ── GET /api/v1/admins/login ─────────────────────────────────────────────
// Lets the sign-in screen show the "create the owner account" flow when the
// database has no admins yet.
export const GET = route(async () => {
  const bootstrap = await needsBootstrap();

  return sendResponse({
    statusCode: 200,
    success: true,
    message: "Auth status",
    data: { needsBootstrap: bootstrap },
  });
});
