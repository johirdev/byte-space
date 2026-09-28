import { NextRequest } from "next/server";
import { route } from "@/app/lib/catchAsync";
import { sendResponse } from "@/app/lib/sendResponse";
import { requireAuth, CONTENT_EDITORS } from "@/app/lib/tokenRoleAccess";
import { seedCourseDemo } from "@/app/services/courseSeed.service";

export const dynamic = "force-dynamic";

// ── POST /api/v1/courses/seed ─────────────────────────────────────────────
// Loads demo categories, courses and reviews into an empty catalogue.
export const POST = route(async (req: NextRequest) => {
  requireAuth(req, CONTENT_EDITORS);
  const data = await seedCourseDemo();

  return sendResponse({
    statusCode: 201,
    success: true,
    message: `Loaded ${data.courses} demo courses and ${data.reviews} reviews`,
    data,
  });
});
