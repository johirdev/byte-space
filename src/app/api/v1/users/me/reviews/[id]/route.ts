import { route, readJson } from "@/app/lib/catchAsync";
import { sendResponse } from "@/app/lib/sendResponse";
import { requireUser } from "@/app/lib/userAuth";
import { deleteMyReview, updateMyReview } from "@/app/services/courseReview.service";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

// ── PATCH /api/v1/users/me/reviews/:id — { rating?, comment? } ────────────
export const PATCH = route<Ctx>(async (req, { params }) => {
  const user = requireUser(req);
  const { id } = await params;
  const data = await updateMyReview(user.id, id, await readJson(req));
  return sendResponse({ statusCode: 200, success: true, message: "Review updated", data });
});

// ── DELETE /api/v1/users/me/reviews/:id ───────────────────────────────────
export const DELETE = route<Ctx>(async (req, { params }) => {
  const user = requireUser(req);
  const { id } = await params;
  await deleteMyReview(user.id, id);
  return sendResponse({ statusCode: 200, success: true, message: "Review deleted" });
});
