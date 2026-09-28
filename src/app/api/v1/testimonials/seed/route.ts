import { NextRequest } from "next/server";
import { route } from "@/app/lib/catchAsync";
import { sendResponse } from "@/app/lib/sendResponse";
import { requireAuth, CONTENT_EDITORS } from "@/app/lib/tokenRoleAccess";
import { seedTestimonials } from "@/app/services/testimonial.service";

export const dynamic = "force-dynamic";

// ── POST /api/v1/testimonials/seed — the 3 Figma samples (empty list only) ─
export const POST = route(async (req: NextRequest) => {
  requireAuth(req, CONTENT_EDITORS);
  const count = await seedTestimonials();
  return sendResponse({ statusCode: 201, success: true, message: `Added ${count} sample testimonials`, data: { count } });
});
