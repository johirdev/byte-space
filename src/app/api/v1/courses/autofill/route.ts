import { NextRequest } from "next/server";
import { route, readJson } from "@/app/lib/catchAsync";
import { sendResponse } from "@/app/lib/sendResponse";
import { requireAuth, CONTENT_EDITORS } from "@/app/lib/tokenRoleAccess";
import { ApiError } from "@/app/lib/apiError";
import { oneOf, str } from "@/app/lib/validate";
import { COURSE_LEVELS } from "@/app/types";
import { findCategory } from "@/app/services/courseCategory.service";
import { generateCourseDraft } from "@/app/services/courseAutofill.service";

export const dynamic = "force-dynamic";

// ── POST /api/v1/courses/autofill ─────────────────────────────────────────
// Body: { category: id|slug, title?, level?, creatorName? }
// Returns a full course draft for the form to pre-fill. Nothing is saved.
export const POST = route(async (req: NextRequest) => {
  requireAuth(req, CONTENT_EDITORS);
  const body = await readJson(req);

  const categoryKey = str(body.category);
  if (!categoryKey) {
    throw new ApiError(400, "Choose a category first", { category: "Choose a category first" });
  }
  const category = await findCategory(categoryKey);
  if (!category) {
    throw new ApiError(404, "Category not found", { category: "That category no longer exists" });
  }

  const level = str(body.level);
  const data = generateCourseDraft({
    category: category.name,
    title: str(body.title),
    level: level ? oneOf(level, COURSE_LEVELS, "Beginner") : undefined,
    creatorName: str(body.creatorName),
  });

  return sendResponse({
    statusCode: 200,
    success: true,
    message: `Draft generated for ${category.name}`,
    data,
  });
});
