import { route, readJson } from "@/app/lib/catchAsync";
import { sendResponse } from "@/app/lib/sendResponse";
import { requireAuth, CONTENT_EDITORS } from "@/app/lib/tokenRoleAccess";
import { deleteFaq, updateFaq } from "@/app/services/faq.service";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

// ── PATCH /api/v1/faqs/:id ────────────────────────────────────────────────
export const PATCH = route<Ctx>(async (req, { params }) => {
  requireAuth(req, CONTENT_EDITORS);
  const { id } = await params;
  const data = await updateFaq(id, await readJson(req));
  return sendResponse({ statusCode: 200, success: true, message: "FAQ updated", data });
});

// ── DELETE /api/v1/faqs/:id ───────────────────────────────────────────────
export const DELETE = route<Ctx>(async (req, { params }) => {
  requireAuth(req, CONTENT_EDITORS);
  const { id } = await params;
  const data = await deleteFaq(id);
  return sendResponse({ statusCode: 200, success: true, message: "FAQ deleted", data });
});
