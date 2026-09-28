import { NextRequest } from "next/server";

/**
 * Best-effort client IP. Vercel sets `x-forwarded-for` (client first) and
 * `x-real-ip`; local dev has neither, so we fall back to a sentinel rather
 * than throwing — the value is only used for rate limiting and audit logs.
 */
export function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return (
    req.headers.get("x-real-ip")?.trim() ||
    req.headers.get("cf-connecting-ip")?.trim() ||
    "0.0.0.0"
  );
}
