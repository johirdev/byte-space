import { route, readJson } from "@/app/lib/catchAsync";
import { sendResponse } from "@/app/lib/sendResponse";
import { requireAuth, CONTENT_EDITORS, isAdminScope } from "@/app/lib/tokenRoleAccess";
import { deleteCourse, getCourse, updateCourse } from "@/app/services/course.service";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

// ── GET /api/v1/courses/:idOrSlug ─────────────────────────────────────────
// Public callers only see published courses.
export const GET = route<Ctx>(async (req, { params }) => {
  const { id } = await params;
  const data = await getCourse(id, { admin: isAdminScope(req) });

  return sendResponse({
    statusCode: 200,
    success: true,
    message: "Course fetched successfully",
    data,
  });
});

// ── PATCH /api/v1/courses/:id ─────────────────────────────────────────────
export const PATCH = route<Ctx>(async (req, { params }) => {
  requireAuth(req, CONTENT_EDITORS);
  const { id } = await params;
  const data = await updateCourse(id, await readJson(req));

  return sendResponse({
    statusCode: 200,
    success: true,
    message: "Course updated successfully",
    data,
  });
});

// ── DELETE /api/v1/courses/:id ────────────────────────────────────────────
// Also removes the course's reviews.
export const DELETE = route<Ctx>(async (req, { params }) => {
  requireAuth(req, CONTENT_EDITORS);
  const { id } = await params;
  const data = await deleteCourse(id);

  return sendResponse({
    statusCode: 200,
    success: true,
    message: "Course deleted successfully",
    data,
  });
});
