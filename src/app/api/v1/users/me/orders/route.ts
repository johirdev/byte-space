import { NextRequest } from "next/server";
import { route } from "@/app/lib/catchAsync";
import { sendResponse } from "@/app/lib/sendResponse";
import { requireUser } from "@/app/lib/userAuth";
import { listMyOrders } from "@/app/services/order.service";

export const dynamic = "force-dynamic";

// ── GET /api/v1/users/me/orders ───────────────────────────────────────────
export const GET = route(async (req: NextRequest) => {
  const { id } = requireUser(req);
  const data = await listMyOrders(id);
  return sendResponse({ statusCode: 200, success: true, message: "Orders fetched", data });
});
