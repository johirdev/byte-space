import { route, readJson } from "@/app/lib/catchAsync";
import { sendResponse } from "@/app/lib/sendResponse";
import { requireAuth, CONTENT_EDITORS } from "@/app/lib/tokenRoleAccess";
import {
  deleteCategory,
  getCategory,
  updateCategory,
} from "@/app/services/courseCategory.service";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

// ── GET /api/v1/course-categories/:idOrSlug ───────────────────────────────
export const GET = route<Ctx>(async (_req, { params }) => {
  const { id } = await params;
  const data = await getCategory(id);

  return sendResponse({
    statusCode: 200,
    success: true,
    message: "Category fetched successfully",
    data,
  });
});

// ── PATCH /api/v1/course-categories/:id ───────────────────────────────────
export const PATCH = route<Ctx>(async (req, { params }) => {
  requireAuth(req, CONTENT_EDITORS);
  const { id } = await params;
  const data = await updateCategory(id, await readJson(req));

  return sendResponse({
    statusCode: 200,
    success: true,
    message: "Category updated successfully",
    data,
  });
});

// ── DELETE /api/v1/course-categories/:id ──────────────────────────────────
export const DELETE = route<Ctx>(async (req, { params }) => {
  requireAuth(req, CONTENT_EDITORS);
  const { id } = await params;
  const data = await deleteCategory(id);

  return sendResponse({
    statusCode: 200,
    success: true,
    message: "Category deleted successfully",
    data,
  });
});
