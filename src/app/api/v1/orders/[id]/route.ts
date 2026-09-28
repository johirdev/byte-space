import { route, readJson } from "@/app/lib/catchAsync";
import { sendResponse } from "@/app/lib/sendResponse";
import { ApiError } from "@/app/lib/apiError";
import { requireAuth, ADMIN_MANAGERS, PANEL_VIEWERS } from "@/app/lib/tokenRoleAccess";
import { getOrder, refundOrder } from "@/app/services/order.service";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

// ── GET /api/v1/orders/:id (admin) ────────────────────────────────────────
export const GET = route<Ctx>(async (req, { params }) => {
  requireAuth(req, PANEL_VIEWERS);
  const { id } = await params;
  const data = await getOrder(id);
  return sendResponse({ statusCode: 200, success: true, message: "Order fetched", data });
});

// ── PATCH /api/v1/orders/:id (superadmin) — { status: "refunded" } ────────
// Refunding revokes the learner's access to the order's courses.
export const PATCH = route<Ctx>(async (req, { params }) => {
  requireAuth(req, ADMIN_MANAGERS);
  const { id } = await params;
  const body = await readJson<{ status?: string }>(req);
  if (body.status !== "refunded") throw new ApiError(400, "Only refunds are supported");

  const data = await refundOrder(id);
  return sendResponse({ statusCode: 200, success: true, message: "Order refunded", data });
});
