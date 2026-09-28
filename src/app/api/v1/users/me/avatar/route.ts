import { NextRequest } from "next/server";
import { route } from "@/app/lib/catchAsync";
import { sendResponse } from "@/app/lib/sendResponse";
import { requireUser } from "@/app/lib/userAuth";
import { readImageFromForm, uploadToImgbb } from "@/app/lib/imgbb";
import { getSessionUser, updateProfile } from "@/app/services/user.service";

export const dynamic = "force-dynamic";

// ── POST /api/v1/users/me/avatar ──────────────────────────────────────────
// multipart/form-data `image` → uploaded to imgbb → saved as the avatar.
export const POST = route(async (req: NextRequest) => {
  const { id } = requireUser(req);
  const file = await readImageFromForm(req);
  const image = await uploadToImgbb(file);

  await updateProfile(id, { avatar: image.url });
  const data = await getSessionUser(id);

  return sendResponse({ statusCode: 200, success: true, message: "Profile photo updated", data });
});

// ── DELETE /api/v1/users/me/avatar — back to initials ─────────────────────
export const DELETE = route(async (req: NextRequest) => {
  const { id } = requireUser(req);
  await updateProfile(id, { avatar: "" });
  const data = await getSessionUser(id);

  return sendResponse({ statusCode: 200, success: true, message: "Profile photo removed", data });
});
