import { NextRequest } from "next/server";
import { route, readJson } from "@/app/lib/catchAsync";
import { sendResponse } from "@/app/lib/sendResponse";
import { requireAuth, ADMIN_MANAGERS, PANEL_VIEWERS } from "@/app/lib/tokenRoleAccess";
import { getClientIp } from "@/app/lib/getClientIp";
import {
  createAdminService,
  getAdminsService,
  needsBootstrap,
} from "@/app/services/admin.service";

export const dynamic = "force-dynamic";

// ── GET /api/v1/admins ───────────────────────────────────────────────────
export const GET = route(async (req: NextRequest) => {
  requireAuth(req, PANEL_VIEWERS);
  const data = await getAdminsService();

  return sendResponse({
    statusCode: 200,
    success: true,
    message: "Admins fetched successfully",
    data,
  });
});

// ── POST /api/v1/admins ──────────────────────────────────────────────────
// Creating admins requires a superadmin token. The one exception is the very
// first account: with an empty admins collection nobody could ever sign in,
// so that single bootstrap call is allowed unauthenticated and is forced to
// the superadmin role.
export const POST = route(async (req: NextRequest) => {
  const bootstrapping = await needsBootstrap();
  if (!bootstrapping) requireAuth(req, ADMIN_MANAGERS);

  const body = await readJson(req);
  const data = await createAdminService(body, getClientIp(req));

  return sendResponse({
    statusCode: 201,
    success: true,
    message: bootstrapping
      ? "Owner account created. You can sign in now."
      : "Admin created successfully",
    data,
  });
});
