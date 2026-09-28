import { NextRequest } from "next/server";
import { route, readJson } from "@/app/lib/catchAsync";
import { sendResponse } from "@/app/lib/sendResponse";
import { requireAuth, CONTENT_EDITORS, isAdminScope } from "@/app/lib/tokenRoleAccess";
import { createFaq, listFaqs } from "@/app/services/faq.service";

export const dynamic = "force-dynamic";

// ── GET /api/v1/faqs ──────────────────────────────────────────────────────
// Public: visible FAQs in order. `?scope=admin` + panel token: all.
// Default FAQs are seeded automatically the first time this is called.
export const GET = route(async (req: NextRequest) => {
  const data = await listFaqs({ admin: isAdminScope(req) });
  return sendResponse({ statusCode: 200, success: true, message: "FAQs fetched", data });
});

// ── POST /api/v1/faqs ─────────────────────────────────────────────────────
export const POST = route(async (req: NextRequest) => {
  requireAuth(req, CONTENT_EDITORS);
  const data = await createFaq(await readJson(req));
  return sendResponse({ statusCode: 201, success: true, message: "FAQ created", data });
});
