import config from "@/config/Config";
import { ApiError } from "./apiError";

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB
export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"];

export type HostedImage = {
  url: string;
  thumb: string;
  delete_url: string;
  width: number;
  height: number;
};

type ImgbbResponse = {
  success?: boolean;
  data?: {
    url: string;
    display_url: string;
    delete_url: string;
    width: number | string;
    height: number | string;
    thumb?: { url: string };
  };
  error?: { message?: string };
};

/** Pulls the `image` file out of a multipart request and validates it. */
export async function readImageFromForm(req: Request, field = "image"): Promise<File> {
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    throw new ApiError(400, "Send the image as multipart/form-data");
  }

  const file = form.get(field);
  if (!(file instanceof File) || file.size === 0) {
    throw new ApiError(400, "No image received", { [field]: "Choose an image to upload" });
  }
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    throw new ApiError(400, "Unsupported image type", { [field]: "Use JPG, PNG, WEBP, GIF or AVIF" });
  }
  if (file.size > MAX_IMAGE_BYTES) {
    throw new ApiError(400, "Image is too large", { [field]: "Images must be 5 MB or smaller" });
  }
  return file;
}

/** Uploads to imgbb with the server-side key (IMGBB_API_KEY never reaches the browser). */
export async function uploadToImgbb(file: File): Promise<HostedImage> {
  const apiKey = config.Imagebb;
  if (!apiKey) throw new ApiError(500, "Image uploads are not configured (IMGBB_API_KEY is missing)");

  const body = new FormData();
  body.append("image", file, file.name || "upload");

  let res: Response;
  try {
    res = await fetch(`https://api.imgbb.com/1/upload?key=${encodeURIComponent(apiKey)}`, {
      method: "POST",
      body,
    });
  } catch {
    throw new ApiError(502, "Could not reach the image host. Try again.");
  }

  const json = (await res.json().catch(() => ({}))) as ImgbbResponse;
  if (!res.ok || !json.success || !json.data) {
    throw new ApiError(502, json.error?.message ?? `Image host rejected the upload (${res.status})`);
  }

  return {
    url: json.data.display_url || json.data.url,
    thumb: json.data.thumb?.url ?? json.data.url,
    delete_url: json.data.delete_url,
    width: Number(json.data.width),
    height: Number(json.data.height),
  };
}
