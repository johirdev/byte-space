import { NextRequest } from "next/server";
import { route, readJson } from "@/app/lib/catchAsync";
import { sendResponse } from "@/app/lib/sendResponse";
import { requireAuth, CONTENT_EDITORS, PANEL_VIEWERS } from "@/app/lib/tokenRoleAccess";
import { bool, paginationOf } from "@/app/lib/validate";
import { createReview, listReviews } from "@/app/services/courseReview.service";

export const dynamic = "force-dynamic";

// ── GET /api/v1/course-reviews ────────────────────────────────────────────
// Admin list across all courses. Query: course, rating, status, q, page, limit.
// Without `page` (or with `all=true`) every matching review is returned.
export const GET = route(async (req: NextRequest) => {
  requireAuth(req, PANEL_VIEWERS);
  const params = req.nextUrl.searchParams;
  const { page, limit } = paginationOf(params, { limit: 20 });

  const { data, meta } = await listReviews({
    course: params.get("course"),
    rating: params.get("rating"),
    status: params.get("status"),
    q: params.get("q"),
    page,
    limit,
    all: bool(params.get("all")) || !params.has("page"),
  });

  return sendResponse({
    statusCode: 200,
    success: true,
    message: "Reviews fetched successfully",
    data,
    meta,
  });
});

// ── POST /api/v1/course-reviews ───────────────────────────────────────────
export const POST = route(async (req: NextRequest) => {
  requireAuth(req, CONTENT_EDITORS);
  const data = await createReview(await readJson(req));

  return sendResponse({
    statusCode: 201,
    success: true,
    message: "Review created successfully",
    data,
  });
});
