import { NextRequest } from "next/server";
import { route, readJson } from "@/app/lib/catchAsync";
import { sendResponse } from "@/app/lib/sendResponse";
import { requireUser } from "@/app/lib/userAuth";
import { getActiveUser } from "@/app/services/user.service";
import { createMyReview, listMyReviews } from "@/app/services/courseReview.service";

export const dynamic = "force-dynamic";

// ── GET /api/v1/users/me/reviews ──────────────────────────────────────────
export const GET = route(async (req: NextRequest) => {
  const { id } = requireUser(req);
  const data = await listMyReviews(id);
  return sendResponse({ statusCode: 200, success: true, message: "Reviews fetched", data });
});

// ── POST /api/v1/users/me/reviews ─────────────────────────────────────────
// Body: { course, rating (1–5), comment }. Enrolled learners only, one each.
export const POST = route(async (req: NextRequest) => {
  const { id } = requireUser(req);
  const user = await getActiveUser(id);
  const data = await createMyReview(
    { _id: id, name: user.name, avatar: user.avatar, headline: user.headline },
    await readJson(req),
  );
  return sendResponse({ statusCode: 201, success: true, message: "Thanks for your review!", data });
});
