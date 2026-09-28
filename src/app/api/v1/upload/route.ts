import { NextRequest } from "next/server";
import { route } from "@/app/lib/catchAsync";
import { sendResponse } from "@/app/lib/sendResponse";
import { requireAuth, CONTENT_EDITORS } from "@/app/lib/tokenRoleAccess";
import { ApiError } from "@/app/lib/apiError";
import config from "@/config/Config";

export const dynamic = "force-dynamic";

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"];

type ImgbbResponse = {
  success?: boolean;
  data?: {
    url: string;
    display_url: string;
    delete_url: string;
    width: number | string;
    height: number | string;
    size: number | string;
    thumb?: { url: string };
  };
  error?: { message?: string };
};

// ── POST /api/v1/upload ───────────────────────────────────────────────────
// multipart/form-data with an `image` file. The imgbb key stays server-side
// (IMGBB_API_KEY is not NEXT_PUBLIC_), so the browser always uploads via here.
export const POST = route(async (req: NextRequest) => {
  requireAuth(req, CONTENT_EDITORS);

  const apiKey = config.Imagebb;
  if (!apiKey) throw new ApiError(500, "Image uploads are not configured (IMGBB_API_KEY is missing)");

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    throw new ApiError(400, "Send the image as multipart/form-data");
  }

  const file = form.get("image");
  if (!(file instanceof File) || file.size === 0) {
    throw new ApiError(400, "No image received", { image: "Choose an image to upload" });
  }
  if (!ALLOWED.includes(file.type)) {
    throw new ApiError(400, "Unsupported image type", { image: "Use JPG, PNG, WEBP, GIF or AVIF" });
  }
  if (file.size > MAX_BYTES) {
    throw new ApiError(400, "Image is too large", { image: "Images must be 5 MB or smaller" });
  }

  const upstream = new FormData();
  upstream.append("image", file, file.name || "upload");

  let res: Response;
  try {
    res = await fetch(`https://api.imgbb.com/1/upload?key=${encodeURIComponent(apiKey)}`, {
      method: "POST",
      body: upstream,
    });
  } catch {
    throw new ApiError(502, "Could not reach the image host. Try again.");
  }

  const json = (await res.json().catch(() => ({}))) as ImgbbResponse;
  if (!res.ok || !json.success || !json.data) {
    throw new ApiError(502, json.error?.message ?? `Image host rejected the upload (${res.status})`);
  }

  return sendResponse({
    statusCode: 201,
    success: true,
    message: "Image uploaded",
    data: {
      url: json.data.display_url || json.data.url,
      thumb: json.data.thumb?.url ?? json.data.url,
      delete_url: json.data.delete_url,
      width: Number(json.data.width),
      height: Number(json.data.height),
    },
  });
});
