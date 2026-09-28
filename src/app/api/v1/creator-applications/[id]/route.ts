import { route, readJson } from "@/app/lib/catchAsync";
import { sendResponse } from "@/app/lib/sendResponse";
import { requireAuth, ADMIN_MANAGERS, PANEL_VIEWERS } from "@/app/lib/tokenRoleAccess";
import type { AdminRole } from "@/app/types";
import {
  deleteApplication,
  getApplication,
  reviewApplication,
} from "@/app/services/creatorApplication.service";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

/** Approving a creator lets them publish under the brand — admins only. */
const REVIEWERS: AdminRole[] = ["superadmin", "admin"];

// ── GET /api/v1/creator-applications/:id (admin) ──────────────────────────
export const GET = route<Ctx>(async (req, { params }) => {
  requireAuth(req, PANEL_VIEWERS);
  const { id } = await params;
  const data = await getApplication(id);
  return sendResponse({ statusCode: 200, success: true, message: "Application fetched", data });
});

// ── PATCH /api/v1/creator-applications/:id — { action, note } ─────────────
// action: "approve" → verified creator + user role "creator"; "reject" needs a note.
export const PATCH = route<Ctx>(async (req, { params }) => {
  const admin = requireAuth(req, REVIEWERS);
  const { id } = await params;
  const body = await readJson<{ action?: string; note?: string }>(req);
  const data = await reviewApplication(id, body, { id: admin.id, name: admin.name });
  return sendResponse({
    statusCode: 200,
    success: true,
    message: body.action === "approve" ? `${data.application.name} is now a verified creator` : "Application rejected",
    data,
  });
});

// ── DELETE /api/v1/creator-applications/:id (superadmin) ──────────────────
export const DELETE = route<Ctx>(async (req, { params }) => {
  requireAuth(req, ADMIN_MANAGERS);
  const { id } = await params;
  await deleteApplication(id);
  return sendResponse({ statusCode: 200, success: true, message: "Application deleted" });
});
