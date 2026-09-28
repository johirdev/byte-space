import { NextRequest } from "next/server";
import { route, readJson } from "@/app/lib/catchAsync";
import { sendResponse } from "@/app/lib/sendResponse";
import { requireAuth, PANEL_VIEWERS } from "@/app/lib/tokenRoleAccess";
import { getClientIp } from "@/app/lib/getClientIp";
import {
  getSingleAdminService,
  updateAdminService,
} from "@/app/services/admin.service";

export const dynamic = "force-dynamic";

// ── GET /api/v1/admins/me — the signed-in admin's own record ────────────
export const GET = route(async (req: NextRequest) => {
  const actor = requireAuth(req, PANEL_VIEWERS);
  const data = await getSingleAdminService(actor.id);

  return sendResponse({
    statusCode: 200,
    success: true,
    message: "Account fetched successfully",
    data,
  });
});

// ── PATCH /api/v1/admins/me — self-service profile & password ───────────
export const PATCH = route(async (req: NextRequest) => {
  const actor = requireAuth(req, PANEL_VIEWERS);
  const body = await readJson<Record<string, unknown>>(req);

  // Nobody escalates their own role from here.
  delete body.admin_role;
  delete body.is_active;

  const data = await updateAdminService(actor.id, body, getClientIp(req), {
    id: actor.id,
    role: actor.role,
  });

  return sendResponse({
    statusCode: 200,
    success: true,
    message: "Account updated successfully",
    data,
  });
});
