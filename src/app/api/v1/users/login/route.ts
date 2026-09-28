import { NextRequest } from "next/server";
import { route, readJson } from "@/app/lib/catchAsync";
import { sendResponse } from "@/app/lib/sendResponse";
import { setUserSession } from "@/app/lib/userAuth";
import { loginUser } from "@/app/services/user.service";

export const dynamic = "force-dynamic";

// ── POST /api/v1/users/login ──────────────────────────────────────────────
// Body: { email, password }. Sets httpOnly access + refresh cookies.
export const POST = route(async (req: NextRequest) => {
  const user = await loginUser(await readJson(req));

  const response = sendResponse({
    statusCode: 200,
    success: true,
    message: `Welcome back, ${user.name.split(" ")[0]}!`,
    data: user,
  });
  return setUserSession(response, { id: String(user._id), email: user.email, name: user.name });
});
