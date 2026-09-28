import { route, readJson } from "@/app/lib/catchAsync";
import { sendResponse } from "@/app/lib/sendResponse";
import { ApiError } from "@/app/lib/apiError";
import { requireAuth, CONTENT_EDITORS, PANEL_VIEWERS, ADMIN_MANAGERS } from "@/app/lib/tokenRoleAccess";
import { bool } from "@/app/lib/validate";
import { deleteUser, getUserDetail, setUserActive } from "@/app/services/user.service";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

// ── GET /api/v1/users/:id (admin) — profile, enrollments, orders, reviews ─
export const GET = route<Ctx>(async (req, { params }) => {
  requireAuth(req, PANEL_VIEWERS);
  const { id } = await params;
  const data = await getUserDetail(id);
  return sendResponse({ statusCode: 200, success: true, message: "User fetched", data });
});

// ── PATCH /api/v1/users/:id (admin) — { is_active } suspend / reactivate ──
export const PATCH = route<Ctx>(async (req, { params }) => {
  requireAuth(req, CONTENT_EDITORS);
  const { id } = await params;
  const body = await readJson<{ is_active?: unknown }>(req);
  if (body.is_active === undefined) throw new ApiError(400, "Nothing to update");

  const data = await setUserActive(id, bool(body.is_active));
  return sendResponse({
    statusCode: 200,
    success: true,
    message: data.is_active ? "Account reactivated" : "Account suspended",
    data,
  });
});

// ── DELETE /api/v1/users/:id (superadmin) ─────────────────────────────────
export const DELETE = route<Ctx>(async (req, { params }) => {
  requireAuth(req, ADMIN_MANAGERS);
  const { id } = await params;
  const data = await deleteUser(id);
  return sendResponse({ statusCode: 200, success: true, message: "User deleted", data });
});
