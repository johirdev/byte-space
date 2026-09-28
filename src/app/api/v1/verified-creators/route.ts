import { NextRequest } from "next/server";
import { route } from "@/app/lib/catchAsync";
import { sendResponse } from "@/app/lib/sendResponse";
import { requireAuth, PANEL_VIEWERS } from "@/app/lib/tokenRoleAccess";
import { paginationOf } from "@/app/lib/validate";
import { listVerifiedCreators } from "@/app/services/verifiedCreator.service";

export const dynamic = "force-dynamic";

// ── GET /api/v1/verified-creators (admin) ─────────────────────────────────
// Query: q (name / email / code / id), status (active|inactive), page, limit.
export const GET = route(async (req: NextRequest) => {
  requireAuth(req, PANEL_VIEWERS);
  const params = req.nextUrl.searchParams;
  const { page, limit } = paginationOf(params, { limit: 20 });
  const { data, meta } = await listVerifiedCreators({
    q: params.get("q"),
    status: params.get("status"),
    page,
    limit,
  });
  return sendResponse({ statusCode: 200, success: true, message: "Creators fetched", data, meta });
});
