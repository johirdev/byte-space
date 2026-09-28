import { NextRequest } from "next/server";
import { route, readJson } from "@/app/lib/catchAsync";
import { sendResponse } from "@/app/lib/sendResponse";
import { requireUser } from "@/app/lib/userAuth";
import { checkout } from "@/app/services/order.service";
import type { CheckoutPayload } from "@/app/types";

export const dynamic = "force-dynamic";

// ── POST /api/v1/checkout ─────────────────────────────────────────────────
// Body: { courses: [id…], payment_method, card? | wallet? | paypal? }
// Demo payment → creates the order and enrolls the learner in every course.
export const POST = route(async (req: NextRequest) => {
  const { id } = requireUser(req);
  const data = await checkout(id, await readJson<CheckoutPayload>(req));

  return sendResponse({
    statusCode: 201,
    success: true,
    message: `Payment successful — you're enrolled in ${data.items.length} course${data.items.length > 1 ? "s" : ""}!`,
    data,
  });
});
