import { API_BASE, ApiClientError } from "./apiClient";
import type { ApiResponse } from "../types";

export type UploadedImage = {
  url: string;
  thumb: string;
  delete_url: string;
  width: number;
  height: number;
};

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
export const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"];

/** Client-side guard so obviously bad files never leave the browser. */
export const checkImageFile = (file: File): string | null => {
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) return "Use a JPG, PNG, WEBP, GIF or AVIF image";
  if (file.size > MAX_UPLOAD_BYTES) return "Images must be 5 MB or smaller";
  return null;
};

/**
 * Uploads through `/api/v1/upload`, which forwards to imgbb with the
 * server-side key. Returns the hosted URL.
 */
export async function uploadImage(file: File, token: string | null): Promise<UploadedImage> {
  const problem = checkImageFile(file);
  if (problem) throw new ApiClientError(400, problem);

  const body = new FormData();
  body.append("image", file);

  let res: Response;
  try {
    res = await fetch(`${API_BASE}/upload`, {
      method: "POST",
      body,
      credentials: "include",
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
  } catch {
    throw new ApiClientError(0, "Network error — the image was not uploaded");
  }

  const json = (await res.json().catch(() => ({}))) as ApiResponse<UploadedImage>;
  if (!res.ok || !json.success || !json.data) {
    throw new ApiClientError(res.status, json.message || "Upload failed", json.errors);
  }
  return json.data;
}
