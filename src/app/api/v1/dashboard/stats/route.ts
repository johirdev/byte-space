import { NextRequest } from "next/server";
import { route } from "@/app/lib/catchAsync";
import { sendResponse } from "@/app/lib/sendResponse";
import { requireAuth, PANEL_VIEWERS } from "@/app/lib/tokenRoleAccess";
import { getDashboardStats } from "@/app/services/course.service";

export const dynamic = "force-dynamic";

// ── GET /api/v1/dashboard/stats ───────────────────────────────────────────
export const GET = route(async (req: NextRequest) => {
  requireAuth(req, PANEL_VIEWERS);
  const data = await getDashboardStats();

  return sendResponse({
    statusCode: 200,
    success: true,
    message: "Dashboard stats fetched successfully",
    data,
  });
});
