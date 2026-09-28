import { NextRequest } from "next/server";
import { route } from "@/app/lib/catchAsync";
import { sendResponse } from "@/app/lib/sendResponse";
import { requireAuth, CONTENT_EDITORS } from "@/app/lib/tokenRoleAccess";
import { readImageFromForm, uploadToImgbb } from "@/app/lib/imgbb";

export const dynamic = "force-dynamic";

// ── POST /api/v1/upload ───────────────────────────────────────────────────
// Admin image upload (course media). multipart/form-data with an `image` file.
// Learners upload their avatar through POST /api/v1/users/me/avatar instead.
export const POST = route(async (req: NextRequest) => {
  requireAuth(req, CONTENT_EDITORS);
  const file = await readImageFromForm(req);
  const data = await uploadToImgbb(file);

  return sendResponse({
    statusCode: 201,
    success: true,
    message: "Image uploaded",
    data,
  });
});
