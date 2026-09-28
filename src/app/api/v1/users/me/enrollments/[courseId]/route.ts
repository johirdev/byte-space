import { route, readJson } from "@/app/lib/catchAsync";
import { sendResponse } from "@/app/lib/sendResponse";
import { ApiError } from "@/app/lib/apiError";
import { requireUser } from "@/app/lib/userAuth";
import { getMyEnrollment, updateProgress } from "@/app/services/enrollment.service";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ courseId: string }> };

// ── GET /api/v1/users/me/enrollments/:courseIdOrSlug ──────────────────────
export const GET = route<Ctx>(async (req, { params }) => {
  const { id } = requireUser(req);
  const { courseId } = await params;
  const data = await getMyEnrollment(id, courseId);
  if (!data) throw new ApiError(404, "You're not enrolled in this course");

  return sendResponse({ statusCode: 200, success: true, message: "Enrollment fetched", data });
});

// ── PATCH /api/v1/users/me/enrollments/:courseId ──────────────────────────
// Body: { completed_lessons: ["0-0", "0-1", …] } → recalculates progress.
export const PATCH = route<Ctx>(async (req, { params }) => {
  const { id } = requireUser(req);
  const { courseId } = await params;
  const body = await readJson<{ completed_lessons?: unknown }>(req);
  const data = await updateProgress(id, courseId, body.completed_lessons ?? []);

  return sendResponse({ statusCode: 200, success: true, message: "Progress saved", data });
});
