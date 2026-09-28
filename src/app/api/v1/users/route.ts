import { NextRequest } from "next/server";
import { route } from "@/app/lib/catchAsync";
import { sendResponse } from "@/app/lib/sendResponse";
import { requireAuth, PANEL_VIEWERS } from "@/app/lib/tokenRoleAccess";
import { paginationOf } from "@/app/lib/validate";
import { listUsers } from "@/app/services/user.service";

export const dynamic = "force-dynamic";

// ── GET /api/v1/users (admin) ─────────────────────────────────────────────
// Query: q, status (active|suspended), sort (newest|oldest|name), page, limit
export const GET = route(async (req: NextRequest) => {
  requireAuth(req, PANEL_VIEWERS);
  const params = req.nextUrl.searchParams;
  const { page, limit } = paginationOf(params, { limit: 20 });

  const { data, meta } = await listUsers({
    q: params.get("q"),
    status: params.get("status"),
    sort: params.get("sort"),
    page,
    limit,
  });

  return sendResponse({ statusCode: 200, success: true, message: "Users fetched", data, meta });
});
