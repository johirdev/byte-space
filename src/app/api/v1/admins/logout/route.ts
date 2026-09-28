import { sendResponse } from "@/app/lib/sendResponse";

export const dynamic = "force-dynamic";

// ── POST /api/v1/admins/logout — clears both auth cookies ───────────────
export async function POST() {
  const response = sendResponse({
    statusCode: 200,
    success: true,
    message: "Signed out",
  });

  response.cookies.set("access_token", "", { path: "/", maxAge: 0 });
  response.cookies.set("refreshToken", "", { path: "/", maxAge: 0 });
  response.cookies.set("token", "", { path: "/", maxAge: 0 });

  return response;
}
