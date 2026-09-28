import { NextRequest } from "next/server";
import { route } from "@/app/lib/catchAsync";
import { sendResponse } from "@/app/lib/sendResponse";
import { requireUser } from "@/app/lib/userAuth";
import { getMyCreatorStatus } from "@/app/services/creatorApplication.service";

export const dynamic = "force-dynamic";

// ── GET /api/v1/creator-applications/me ───────────────────────────────────
// Verified-creator record (if any), latest application, history, cooldown.
export const GET = route(async (req: NextRequest) => {
  const { id } = requireUser(req);
  const data = await getMyCreatorStatus(id);
  return sendResponse({ statusCode: 200, success: true, message: "Creator status fetched", data });
});
