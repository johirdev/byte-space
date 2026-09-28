import { NextRequest } from "next/server";
import { route } from "@/app/lib/catchAsync";
import { sendResponse } from "@/app/lib/sendResponse";
import { ApiError } from "@/app/lib/apiError";
import {
  USER_REFRESH_COOKIE,
  clearUserSession,
  setUserSession,
  verifyUserRefreshToken,
} from "@/app/lib/userAuth";
import { getActiveUser } from "@/app/services/user.service";
import { toErrorResponse } from "@/app/lib/catchAsync";

export const dynamic = "force-dynamic";

// ── POST /api/v1/users/refresh ────────────────────────────────────────────
// Swaps the refresh cookie for a new access token and rotates the refresh
// token. On any failure the cookies are cleared so the client stops retrying.
export const POST = route(async (req: NextRequest) => {
  const token = req.cookies.get(USER_REFRESH_COOKIE)?.value;
  if (!token) throw new ApiError(401, "No active session");

  try {
    const { id } = verifyUserRefreshToken(token);
    const user = await getActiveUser(id);
    const response = sendResponse({
      statusCode: 200,
      success: true,
      message: "Session refreshed",
      data: user,
    });
    return setUserSession(response, { id, email: user.email, name: user.name });
  } catch (err) {
    const jwtFailure = err instanceof Error && /JsonWebToken|TokenExpired|NotBefore|Wrong token/.test(`${err.name} ${err.message}`);
    // Infrastructure errors (e.g. DB down) must not sign the learner out.
    if (!(err instanceof ApiError) && !jwtFailure) throw err;
    const failure = err instanceof ApiError ? err : new ApiError(401, "Session expired. Please sign in again.");
    return clearUserSession(toErrorResponse(failure));
  }
});
