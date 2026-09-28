import "server-only";
import { cookies } from "next/headers";
import { hasUserSession } from "./userAuth";

/** Server Components: is a learner signed in (valid access or refresh cookie)? */
export async function isSignedIn(): Promise<boolean> {
  const store = await cookies();
  return hasUserSession((name) => store.get(name)?.value);
}

/**
 * Only same-site relative paths are allowed as a post-login redirect —
 * blocks open redirects like `?next=https://evil.example` or `//evil.example`.
 */
export function safeNext(value: string | string[] | undefined, fallback = "/profile"): string {
  const next = Array.isArray(value) ? value[0] : value;
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return fallback;
  if (next.startsWith("/login") || next.startsWith("/register")) return fallback;
  return next;
}
