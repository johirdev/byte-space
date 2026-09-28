import { NextRequest } from "next/server";
import { route, readJson } from "@/app/lib/catchAsync";
import { sendResponse } from "@/app/lib/sendResponse";
import { requireAuth, PANEL_VIEWERS } from "@/app/lib/tokenRoleAccess";
import { requireUser } from "@/app/lib/userAuth";
import { paginationOf } from "@/app/lib/validate";
import { listApplications, submitApplication } from "@/app/services/creatorApplication.service";

export const dynamic = "force-dynamic";

// ── GET /api/v1/creator-applications (admin) ──────────────────────────────
// Query: q, status (pending|approved|rejected), page, limit.
// `data` is `{ applications, counts }` so the status tabs show totals.
export const GET = route(async (req: NextRequest) => {
  requireAuth(req, PANEL_VIEWERS);
  const params = req.nextUrl.searchParams;
  const { page, limit } = paginationOf(params, { limit: 20 });
  const { data, meta, counts } = await listApplications({
    q: params.get("q"),
    status: params.get("status"),
    page,
    limit,
  });
  return sendResponse({
    statusCode: 200,
    success: true,
    message: "Applications fetched",
    data: { applications: data, counts },
    meta,
  });
});

// ── POST /api/v1/creator-applications (signed-in learner) ─────────────────
// One application per user every 5 minutes (429 with `errors.retry_after`).
export const POST = route(async (req: NextRequest) => {
  const { id } = requireUser(req);
  const data = await submitApplication(id, await readJson(req));
  return sendResponse({
    statusCode: 201,
    success: true,
    message: "Application sent! Our team will review it shortly.",
    data,
  });
});
