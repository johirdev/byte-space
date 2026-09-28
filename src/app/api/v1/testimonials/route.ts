import { NextRequest } from "next/server";
import { route, readJson } from "@/app/lib/catchAsync";
import { sendResponse } from "@/app/lib/sendResponse";
import { requireAuth, CONTENT_EDITORS, isAdminScope } from "@/app/lib/tokenRoleAccess";
import { createTestimonial, listTestimonials } from "@/app/services/testimonial.service";

export const dynamic = "force-dynamic";

// ── GET /api/v1/testimonials ──────────────────────────────────────────────
// Public: visible ones in display order. `?scope=admin` + panel token: all.
export const GET = route(async (req: NextRequest) => {
  const data = await listTestimonials({ admin: isAdminScope(req) });
  return sendResponse({ statusCode: 200, success: true, message: "Testimonials fetched", data });
});

// ── POST /api/v1/testimonials ─────────────────────────────────────────────
export const POST = route(async (req: NextRequest) => {
  requireAuth(req, CONTENT_EDITORS);
  const data = await createTestimonial(await readJson(req));
  return sendResponse({ statusCode: 201, success: true, message: "Testimonial created", data });
});
