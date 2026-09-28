import { NextRequest } from "next/server";
import { route, readJson } from "@/app/lib/catchAsync";
import { sendResponse } from "@/app/lib/sendResponse";
import { requireAuth, CONTENT_EDITORS } from "@/app/lib/tokenRoleAccess";
import { reorderTestimonials } from "@/app/services/testimonial.service";

export const dynamic = "force-dynamic";

// ── PATCH /api/v1/testimonials/reorder — { ids: [id…] } in display order ──
export const PATCH = route(async (req: NextRequest) => {
  requireAuth(req, CONTENT_EDITORS);
  const { ids } = await readJson<{ ids?: unknown }>(req);
  const updated = await reorderTestimonials(ids);
  return sendResponse({ statusCode: 200, success: true, message: "Order saved", data: { updated } });
});
