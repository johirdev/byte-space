import { route } from "@/app/lib/catchAsync";
import { sendResponse } from "@/app/lib/sendResponse";
import { paginationOf } from "@/app/lib/validate";
import { getCourseReviews } from "@/app/services/courseReview.service";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

// ── GET /api/v1/courses/:idOrSlug/reviews ─────────────────────────────────
// Approved reviews for a published course. Query: rating (1–5), page, limit.
// `data` is `{ reviews, summary }` so the ratings card and list load together.
export const GET = route<Ctx>(async (req, { params }) => {
  const { id } = await params;
  const search = req.nextUrl.searchParams;
  const { page, limit } = paginationOf(search, { limit: 5, maxLimit: 50 });

  const { data, meta, summary } = await getCourseReviews(id, {
    rating: search.get("rating"),
    page,
    limit,
  });

  return sendResponse({
    statusCode: 200,
    success: true,
    message: "Reviews fetched successfully",
    data: { reviews: data, summary },
    meta,
  });
});
