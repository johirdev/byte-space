import { NextRequest } from "next/server";
import { route, readJson } from "@/app/lib/catchAsync";
import { sendResponse } from "@/app/lib/sendResponse";
import { requireAuth, CONTENT_EDITORS, isAdminScope } from "@/app/lib/tokenRoleAccess";
import { paginationOf } from "@/app/lib/validate";
import { createCourse, listCourses } from "@/app/services/course.service";

export const dynamic = "force-dynamic";

// ── GET /api/v1/courses ───────────────────────────────────────────────────
// Query: q, category (id|slug), level (comma list), price (free|paid),
//        rating (min), featured, sort, page, limit
// Admin (`?scope=admin` + panel token): also sees drafts, may filter `status`.
export const GET = route(async (req: NextRequest) => {
  const params = req.nextUrl.searchParams;
  const { page, limit } = paginationOf(params, { limit: 12 });

  const { data, meta } = await listCourses({
    q: params.get("q"),
    category: params.get("category"),
    level: params.get("level"),
    price: params.get("price"),
    rating: params.get("rating"),
    featured: params.get("featured"),
    status: params.get("status"),
    sort: params.get("sort"),
    page,
    limit,
    admin: isAdminScope(req),
  });

  return sendResponse({
    statusCode: 200,
    success: true,
    message: "Courses fetched successfully",
    data,
    meta,
  });
});

// ── POST /api/v1/courses ──────────────────────────────────────────────────
export const POST = route(async (req: NextRequest) => {
  requireAuth(req, CONTENT_EDITORS);
  const data = await createCourse(await readJson(req));

  return sendResponse({
    statusCode: 201,
    success: true,
    message: "Course created successfully",
    data,
  });
});
