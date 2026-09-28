import { sendResponse } from "@/app/lib/sendResponse";
import { clearUserSession } from "@/app/lib/userAuth";

export const dynamic = "force-dynamic";

// ── POST /api/v1/users/logout — clears both session cookies ──────────────
export async function POST() {
  return clearUserSession(
    sendResponse({ statusCode: 200, success: true, message: "Signed out" }),
  );
}
