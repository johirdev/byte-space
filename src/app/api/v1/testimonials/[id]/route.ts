import { route, readJson } from "@/app/lib/catchAsync";
import { sendResponse } from "@/app/lib/sendResponse";
import { requireAuth, CONTENT_EDITORS } from "@/app/lib/tokenRoleAccess";
import { deleteTestimonial, updateTestimonial } from "@/app/services/testimonial.service";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

// ── PATCH /api/v1/testimonials/:id ────────────────────────────────────────
export const PATCH = route<Ctx>(async (req, { params }) => {
  requireAuth(req, CONTENT_EDITORS);
  const { id } = await params;
  const data = await updateTestimonial(id, await readJson(req));
  return sendResponse({ statusCode: 200, success: true, message: "Testimonial updated", data });
});

// ── DELETE /api/v1/testimonials/:id ───────────────────────────────────────
export const DELETE = route<Ctx>(async (req, { params }) => {
  requireAuth(req, CONTENT_EDITORS);
  const { id } = await params;
  const data = await deleteTestimonial(id);
  return sendResponse({ statusCode: 200, success: true, message: "Testimonial deleted", data });
});
