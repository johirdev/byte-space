import { NextRequest } from "next/server";
import { route, readJson } from "@/app/lib/catchAsync";
import { sendResponse } from "@/app/lib/sendResponse";
import { requireAuth, CONTENT_EDITORS, isAdminScope } from "@/app/lib/tokenRoleAccess";
import { createCategory, listCategories } from "@/app/services/courseCategory.service";

export const dynamic = "force-dynamic";

// ── GET /api/v1/course-categories ─────────────────────────────────────────
// Public: active categories with published-course counts.
// `?scope=admin` (with a panel token): every category, all-course counts.
export const GET = route(async (req: NextRequest) => {
  const params = req.nextUrl.searchParams;
  const data = await listCategories({ admin: isAdminScope(req), q: params.get("q") ?? undefined });

  return sendResponse({
    statusCode: 200,
    success: true,
    message: "Categories fetched successfully",
    data,
  });
});

// ── POST /api/v1/course-categories ────────────────────────────────────────
export const POST = route(async (req: NextRequest) => {
  requireAuth(req, CONTENT_EDITORS);
  const data = await createCategory(await readJson(req));

  return sendResponse({
    statusCode: 201,
    success: true,
    message: "Category created successfully",
    data,
  });
});
