import { NextRequest } from "next/server";
import { route } from "@/app/lib/catchAsync";
import { sendResponse } from "@/app/lib/sendResponse";
import { requireAuth, CONTENT_EDITORS } from "@/app/lib/tokenRoleAccess";
import { restoreDefaultFaqs } from "@/app/services/faq.service";

export const dynamic = "force-dynamic";

// ── POST /api/v1/faqs/restore-defaults — re-adds missing default questions ─
export const POST = route(async (req: NextRequest) => {
  requireAuth(req, CONTENT_EDITORS);
  const added = await restoreDefaultFaqs();
  return sendResponse({
    statusCode: 200,
    success: true,
    message: added ? `Restored ${added} default FAQ${added > 1 ? "s" : ""}` : "All default FAQs are already there",
    data: { added },
  });
});
