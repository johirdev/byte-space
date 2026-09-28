import { route } from "@/app/lib/catchAsync";
import { sendResponse } from "@/app/lib/sendResponse";
import { getCreator } from "@/app/services/creator.service";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ slug: string }> };

// ── GET /api/v1/creators/:slug ────────────────────────────────────────────
// Profile + stats. Their courses: GET /api/v1/courses?creator=:slug
export const GET = route<Ctx>(async (_req, { params }) => {
  const { slug } = await params;
  const data = await getCreator(slug);
  return sendResponse({ statusCode: 200, success: true, message: "Creator fetched", data });
});
