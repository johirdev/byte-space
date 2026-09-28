import { route, readJson } from "@/app/lib/catchAsync";
import { sendResponse } from "@/app/lib/sendResponse";
import { requireAuth, CONTENT_EDITORS } from "@/app/lib/tokenRoleAccess";
import { deleteReview, updateReview } from "@/app/services/courseReview.service";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

// ── PATCH /api/v1/course-reviews/:id ──────────────────────────────────────
export const PATCH = route<Ctx>(async (req, { params }) => {
  requireAuth(req, CONTENT_EDITORS);
  const { id } = await params;
  const data = await updateReview(id, await readJson(req));

  return sendResponse({
    statusCode: 200,
    success: true,
    message: "Review updated successfully",
    data,
  });
});

// ── DELETE /api/v1/course-reviews/:id ─────────────────────────────────────
export const DELETE = route<Ctx>(async (req, { params }) => {
  requireAuth(req, CONTENT_EDITORS);
  const { id } = await params;
  const data = await deleteReview(id);

  return sendResponse({
    statusCode: 200,
    success: true,
    message: "Review deleted successfully",
    data,
  });
});
