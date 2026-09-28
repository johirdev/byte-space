import { route, readJson } from "@/app/lib/catchAsync";
import { sendResponse } from "@/app/lib/sendResponse";
import { requireAuth, ADMIN_MANAGERS, PANEL_VIEWERS } from "@/app/lib/tokenRoleAccess";
import type { AdminRole } from "@/app/types";
import {
  deleteVerifiedCreator,
  getVerifiedCreator,
  updateVerifiedCreator,
} from "@/app/services/verifiedCreator.service";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };
const EDITORS: AdminRole[] = ["superadmin", "admin"];

// ── GET /api/v1/verified-creators/:id (admin) ─────────────────────────────
export const GET = route<Ctx>(async (req, { params }) => {
  requireAuth(req, PANEL_VIEWERS);
  const { id } = await params;
  const data = await getVerifiedCreator(id);
  return sendResponse({ statusCode: 200, success: true, message: "Creator fetched", data });
});

// ── PATCH /api/v1/verified-creators/:id (admin) ───────────────────────────
// Edits flow into every linked course's creator snapshot.
export const PATCH = route<Ctx>(async (req, { params }) => {
  requireAuth(req, EDITORS);
  const { id } = await params;
  const data = await updateVerifiedCreator(id, await readJson(req));
  return sendResponse({ statusCode: 200, success: true, message: "Creator updated", data });
});

// ── DELETE /api/v1/verified-creators/:id (superadmin) ─────────────────────
export const DELETE = route<Ctx>(async (req, { params }) => {
  requireAuth(req, ADMIN_MANAGERS);
  const { id } = await params;
  const data = await deleteVerifiedCreator(id);
  return sendResponse({ statusCode: 200, success: true, message: "Creator removed", data });
});
