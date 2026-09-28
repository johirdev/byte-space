import { API_BASE, ApiClientError, refreshUserSession } from "./apiClient";
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

/** Multipart POST that unwraps the API envelope (JSON helper can't send files). */
export async function postImage<T>(
  path: string,
  file: File,
  opts: { token?: string | null; auth?: "user" } = {},
  retried = false,
): Promise<{ data: T; message: string }> {
  const problem = checkImageFile(file);
  if (problem) throw new ApiClientError(400, problem);

  const body = new FormData();
  body.append("image", file);

  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      method: "POST",
      body,
      credentials: "include",
      headers: opts.token ? { Authorization: `Bearer ${opts.token}` } : undefined,
    });
  } catch {
    throw new ApiClientError(0, "Network error — the image was not uploaded");
  }

  if (res.status === 401 && opts.auth === "user" && !retried && (await refreshUserSession())) {
    return postImage<T>(path, file, opts, true);
  }

  const json = (await res.json().catch(() => ({}))) as ApiResponse<T>;
  if (!res.ok || !json.success || json.data === undefined) {
    throw new ApiClientError(res.status, json.message || "Upload failed", json.errors);
  }
  return { data: json.data, message: json.message };
}

/**
 * Admin upload through `/api/v1/upload`, which forwards to imgbb with the
 * server-side key. Returns the hosted URL.
 */
export async function uploadImage(file: File, token: string | null): Promise<UploadedImage> {
  return (await postImage<UploadedImage>("/upload", file, { token })).data;
}
