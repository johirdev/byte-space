import { NextRequest } from "next/server";
import { route, readJson } from "@/app/lib/catchAsync";
import { sendResponse } from "@/app/lib/sendResponse";
import { setUserSession } from "@/app/lib/userAuth";
import { registerUser } from "@/app/services/user.service";

export const dynamic = "force-dynamic";

// ── POST /api/v1/users/register ───────────────────────────────────────────
// Body: { name, email, password }. Signs the new learner straight in.
export const POST = route(async (req: NextRequest) => {
  const user = await registerUser(await readJson(req));

  const response = sendResponse({
    statusCode: 201,
    success: true,
    message: `Welcome to ByteSpace, ${user.name.split(" ")[0]}!`,
    data: user,
  });
  return setUserSession(response, { id: String(user._id), email: user.email, name: user.name });
});
