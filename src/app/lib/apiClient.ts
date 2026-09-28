import type { ApiMeta, ApiResponse } from "../types";

export class ApiClientError extends Error {
  status: number;
  errors?: Record<string, string>;

  constructor(status: number, message: string, errors?: Record<string, string>) {
    super(message);
    this.status = status;
    this.errors = errors;
    this.name = "ApiClientError";
  }
}

export const API_BASE = "/api/v1";

type RequestOptions = {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  token?: string | null;
  /** Query string params — undefined/empty values are dropped. */
  query?: Record<string, string | number | boolean | undefined | null>;
  signal?: AbortSignal;
  cache?: RequestCache;
};

export const buildQuery = (
  query: RequestOptions["query"] = {},
): string => {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === "") continue;
    params.set(key, String(value));
  }
  const qs = params.toString();
  return qs ? `?${qs}` : "";
};

/**
 * Single fetch wrapper for every call the browser makes. Unwraps the
 * `{ success, message, data, meta }` envelope and turns non-2xx responses
 * into a typed `ApiClientError` carrying field-level messages.
 */
export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<{ data: T; meta?: ApiMeta; message: string }> {
  const { method = "GET", body, token, query, signal, cache } = options;

  const headers: Record<string, string> = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (token) headers.Authorization = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}${buildQuery(query)}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      credentials: "include",
      signal,
      cache: cache ?? "no-store",
    });
  } catch (err) {
    if ((err as Error)?.name === "AbortError") throw err;
    throw new ApiClientError(0, "Network error — please check your connection.");
  }

  let json: ApiResponse<T>;
  try {
    json = (await res.json()) as ApiResponse<T>;
  } catch {
    throw new ApiClientError(res.status, `Unexpected response (${res.status})`);
  }

  if (!res.ok || json.success === false) {
    throw new ApiClientError(
      res.status,
      json.message || `Request failed (${res.status})`,
      json.errors,
    );
  }

  return { data: json.data as T, meta: json.meta, message: json.message };
}

/** Shorthand for reads where only the payload matters. */
export const apiGet = async <T>(
  path: string,
  options: Omit<RequestOptions, "method" | "body"> = {},
): Promise<T> => (await apiRequest<T>(path, { ...options, method: "GET" })).data;
