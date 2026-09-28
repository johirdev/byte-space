import { NextRequest } from "next/server";
import { route, readJson } from "@/app/lib/catchAsync";
import { sendResponse } from "@/app/lib/sendResponse";
import { requireUser } from "@/app/lib/userAuth";
import { getSessionUser, updateProfile } from "@/app/services/user.service";

export const dynamic = "force-dynamic";

// ── GET /api/v1/users/me ──────────────────────────────────────────────────
// Profile + enrolled course ids + stats. 401 when signed out.
export const GET = route(async (req: NextRequest) => {
  const { id } = requireUser(req);
  const data = await getSessionUser(id);

  return sendResponse({ statusCode: 200, success: true, message: "Profile fetched", data });
});

// ── PATCH /api/v1/users/me ────────────────────────────────────────────────
// Body (all optional): { name, headline, bio, phone, avatar }
export const PATCH = route(async (req: NextRequest) => {
  const { id } = requireUser(req);
  const body = await readJson<Record<string, unknown>>(req);
  // Email, role and status are not self-editable.
  delete body.email;
  delete body.role;
  delete body.is_active;
  delete body.password;

  await updateProfile(id, body);
  const data = await getSessionUser(id);

  return sendResponse({ statusCode: 200, success: true, message: "Profile updated", data });
});
