import { NextRequest } from "next/server";
import { route } from "@/app/lib/catchAsync";
import { sendResponse } from "@/app/lib/sendResponse";
import { requireAuth, PANEL_VIEWERS } from "@/app/lib/tokenRoleAccess";
import { paginationOf } from "@/app/lib/validate";
import { listOrders } from "@/app/services/order.service";

export const dynamic = "force-dynamic";

// ── GET /api/v1/orders (admin) ────────────────────────────────────────────
// Query: q (order no, customer, txn, course), status, method, page, limit.
// `data` is `{ orders, summary }` so the revenue tiles follow the filters.
export const GET = route(async (req: NextRequest) => {
  requireAuth(req, PANEL_VIEWERS);
  const params = req.nextUrl.searchParams;
  const { page, limit } = paginationOf(params, { limit: 20 });

  const { data, meta, summary } = await listOrders({
    q: params.get("q"),
    status: params.get("status"),
    method: params.get("method"),
    page,
    limit,
  });

  return sendResponse({
    statusCode: 200,
    success: true,
    message: "Orders fetched",
    data: { orders: data, summary },
    meta,
  });
});
