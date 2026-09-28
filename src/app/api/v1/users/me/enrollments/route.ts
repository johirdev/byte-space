import { NextRequest } from "next/server";
import { route } from "@/app/lib/catchAsync";
import { sendResponse } from "@/app/lib/sendResponse";
import { requireUser } from "@/app/lib/userAuth";
import { listMyEnrollments } from "@/app/services/enrollment.service";

export const dynamic = "force-dynamic";

// ── GET /api/v1/users/me/enrollments ──────────────────────────────────────
// Query: q, category (id|slug), level, sort (recent|title|rating|progress|oldest)
export const GET = route(async (req: NextRequest) => {
  const { id } = requireUser(req);
  const params = req.nextUrl.searchParams;

  const data = await listMyEnrollments(id, {
    q: params.get("q"),
    category: params.get("category"),
    level: params.get("level"),
    sort: params.get("sort"),
  });

  return sendResponse({ statusCode: 200, success: true, message: "Enrollments fetched", data });
});
