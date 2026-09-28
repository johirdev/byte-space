import { route, readJson } from "@/app/lib/catchAsync";
import { sendResponse } from "@/app/lib/sendResponse";
import {
  requireAuth,
  ADMIN_MANAGERS,
  PANEL_VIEWERS,
} from "@/app/lib/tokenRoleAccess";
import { getClientIp } from "@/app/lib/getClientIp";
import { ApiError } from "@/app/lib/apiError";
import {
  deleteAdminService,
  getSingleAdminService,
  updateAdminService,
} from "@/app/services/admin.service";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

// ── GET /api/v1/admins/:id ───────────────────────────────────────────────
export const GET = route<Ctx>(async (req, { params }) => {
  const actor = requireAuth(req, PANEL_VIEWERS);
  const { id } = await params;

  // Non-managers may only read their own record.
  if (!ADMIN_MANAGERS.includes(actor.role) && actor.id !== id) {
    throw new ApiError(403, "Forbidden: you can only view your own account");
  }

  const data = await getSingleAdminService(id);

  return sendResponse({
    statusCode: 200,
    success: true,
    message: "Admin fetched successfully",
    data,
  });
});

// ── PATCH /api/v1/admins/:id ─────────────────────────────────────────────
export const PATCH = route<Ctx>(async (req, { params }) => {
  const actor = requireAuth(req, PANEL_VIEWERS);
  const { id } = await params;
  const isManager = ADMIN_MANAGERS.includes(actor.role);

  if (!isManager && actor.id !== id) {
    throw new ApiError(403, "Forbidden: you can only edit your own account");
  }

  const body = await readJson<Record<string, unknown>>(req);

  // Only a superadmin may change roles or activation state.
  if (!isManager) {
    delete body.admin_role;
    delete body.is_active;
  }

  const data = await updateAdminService(id, body, getClientIp(req), {
    id: actor.id,
    role: actor.role,
  });

  return sendResponse({
    statusCode: 200,
    success: true,
    message: "Admin updated successfully",
    data,
  });
});

// ── DELETE /api/v1/admins/:id ────────────────────────────────────────────
export const DELETE = route<Ctx>(async (req, { params }) => {
  const actor = requireAuth(req, ADMIN_MANAGERS);
  const { id } = await params;
  const data = await deleteAdminService(id, actor.id);

  return sendResponse({
    statusCode: 200,
    success: true,
    message: "Admin deleted successfully",
    data,
  });
});
