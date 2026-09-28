import { NextRequest } from "next/server";
import { route } from "@/app/lib/catchAsync";
import { sendResponse } from "@/app/lib/sendResponse";
import { requireAuth, PANEL_VIEWERS } from "@/app/lib/tokenRoleAccess";
import { searchCreators } from "@/app/services/verifiedCreator.service";

export const dynamic = "force-dynamic";

// ── GET /api/v1/verified-creators/search?q= (admin) ───────────────────────
// Course-form picker: up to 10 active creators by name, email, code or id.
export const GET = route(async (req: NextRequest) => {
  requireAuth(req, PANEL_VIEWERS);
  const data = await searchCreators(req.nextUrl.searchParams.get("q"));
  return sendResponse({ statusCode: 200, success: true, message: "Creators found", data });
});
