import { route } from "@/app/lib/catchAsync";
import { sendResponse } from "@/app/lib/sendResponse";
import { listCreators } from "@/app/services/creator.service";

export const dynamic = "force-dynamic";

// ── GET /api/v1/creators ──────────────────────────────────────────────────
// Everyone who has at least one published course, most students first.
export const GET = route(async () => {
  const data = await listCreators();
  return sendResponse({ statusCode: 200, success: true, message: "Creators fetched", data });
});
