import { NextRequest } from "next/server";
import { route, readJson } from "@/app/lib/catchAsync";
import { sendResponse } from "@/app/lib/sendResponse";
import { requireUser, setUserSession } from "@/app/lib/userAuth";
import { changePassword } from "@/app/services/user.service";

export const dynamic = "force-dynamic";

// ── PATCH /api/v1/users/me/password ───────────────────────────────────────
// Body: { current_password, new_password }. Issues fresh session cookies.
export const PATCH = route(async (req: NextRequest) => {
  const user = requireUser(req);
  await changePassword(user.id, await readJson(req));

  return setUserSession(
    sendResponse({ statusCode: 200, success: true, message: "Password changed" }),
    user,
  );
});
