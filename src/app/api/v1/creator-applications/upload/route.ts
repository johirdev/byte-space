import { NextRequest } from "next/server";
import { route } from "@/app/lib/catchAsync";
import { sendResponse } from "@/app/lib/sendResponse";
import { requireUser } from "@/app/lib/userAuth";
import { readImageFromForm, uploadToImgbb } from "@/app/lib/imgbb";

export const dynamic = "force-dynamic";

// ── POST /api/v1/creator-applications/upload ──────────────────────────────
// Applicant photo → imgbb. Returns the hosted URL; nothing is saved until
// the application itself is submitted.
export const POST = route(async (req: NextRequest) => {
  requireUser(req);
  const data = await uploadToImgbb(await readImageFromForm(req));
  return sendResponse({ statusCode: 201, success: true, message: "Photo uploaded", data });
});
