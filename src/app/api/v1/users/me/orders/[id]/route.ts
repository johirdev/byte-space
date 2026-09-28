import { route } from "@/app/lib/catchAsync";
import { sendResponse } from "@/app/lib/sendResponse";
import { requireUser } from "@/app/lib/userAuth";
import { getMyOrder } from "@/app/services/order.service";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

// ── GET /api/v1/users/me/orders/:idOrOrderNo ──────────────────────────────
export const GET = route<Ctx>(async (req, { params }) => {
  const user = requireUser(req);
  const { id } = await params;
  const data = await getMyOrder(user.id, id);
  return sendResponse({ statusCode: 200, success: true, message: "Order fetched", data });
});
