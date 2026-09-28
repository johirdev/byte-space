import { NextRequest } from "next/server";
import { route } from "@/app/lib/catchAsync";
import { sendResponse } from "@/app/lib/sendResponse";
import { ApiError } from "@/app/lib/apiError";
import { refreshAccessTokenService } from "@/app/services/admin.service";

export const dynamic = "force-dynamic";

const isProd = process.env.NODE_ENV === "production";

// ── POST /api/v1/admins/refresh — swaps the httpOnly refresh cookie for a
// fresh access token, so a working session survives a page reload.
export const POST = route(async (req: NextRequest) => {
  const refreshToken = req.cookies.get("refreshToken")?.value;
  if (!refreshToken) throw new ApiError(401, "No active session");

  const { access_token, admin } = await refreshAccessTokenService(refreshToken);

  const response = sendResponse({
    statusCode: 200,
    success: true,
    message: "Session refreshed",
    data: { access_token, admin },
  });

  response.cookies.set("access_token", access_token, {
    httpOnly: false,
    secure: isProd,
    sameSite: "lax",
    maxAge: 24 * 60 * 60,
    path: "/",
  });

  return response;
});
