import { NextRequest } from "next/server";
import { route } from "@/app/lib/catchAsync";
import { sendResponse } from "@/app/lib/sendResponse";
import { requireAuth, PANEL_VIEWERS } from "@/app/lib/tokenRoleAccess";
import { paginationOf } from "@/app/lib/validate";
import { listEnrollments } from "@/app/services/enrollment.service";

export const dynamic = "force-dynamic";

// ── GET /api/v1/enrollments (admin) — Query: q, course, page, limit ───────
export const GET = route(async (req: NextRequest) => {
  requireAuth(req, PANEL_VIEWERS);
  const params = req.nextUrl.searchParams;
  const { page, limit } = paginationOf(params, { limit: 20 });

  const { data, meta } = await listEnrollments({
    q: params.get("q"),
    course: params.get("course"),
    page,
    limit,
  });

  return sendResponse({ statusCode: 200, success: true, message: "Enrollments fetched", data, meta });
});
