import { ApiError } from "./apiError";

export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
export const BD_PHONE_REGEX = /^01[3-9]\d{8}$/;
export const INTL_PHONE_REGEX = /^\+?[0-9\s\-()]{7,20}$/;
export const URL_REGEX = /^https?:\/\/[^\s]+$/i;

/** Trimmed string, or undefined when the value is absent/blank. */
export const str = (val: unknown): string | undefined => {
  if (val === undefined || val === null) return undefined;
  const out = String(val).trim();
  return out.length ? out : undefined;
};

export const num = (val: unknown): number | undefined => {
  if (val === undefined || val === null || val === "") return undefined;
  const n = Number(val);
  return Number.isFinite(n) ? n : undefined;
};

export const bool = (val: unknown): boolean => {
  if (typeof val === "boolean") return val;
  if (typeof val === "string") return val === "true" || val === "1";
  return Boolean(val);
};

/** Accepts an array, a JSON array string, or a comma-separated string. */
export const strList = (val: unknown): string[] => {
  if (Array.isArray(val)) {
    return val.map((v) => String(v).trim()).filter(Boolean);
  }
  if (typeof val === "string") {
    const raw = val.trim();
    if (!raw) return [];
    if (raw.startsWith("[")) {
      try {
        const parsed: unknown = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          return parsed.map((v) => String(v).trim()).filter(Boolean);
        }
      } catch {
        /* fall through to comma-splitting */
      }
    }
    return raw
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean);
  }
  return [];
};

export const oneOf = <T extends string>(
  val: unknown,
  allowed: readonly T[],
  fallback: T,
): T => (allowed.includes(val as T) ? (val as T) : fallback);

export const slugify = (input: string): string =>
  input
    .toLowerCase()
    .trim()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90);

/** Rough reading time from HTML or plain text. */
export const readTimeOf = (content: string): string => {
  const words = content
    .replace(/<[^>]*>/g, " ")
    .split(/\s+/)
    .filter(Boolean).length;
  return `${Math.max(1, Math.round(words / 220))} min read`;
};

/**
 * Collects field errors and throws one 400 with all of them, so the UI can
 * highlight every bad field in a single round trip.
 */
export class FieldCheck {
  private errors: Record<string, string> = {};

  require(field: string, value: unknown, label = field): this {
    if (str(value) === undefined) this.errors[field] = `${label} is required`;
    return this;
  }

  email(field: string, value: unknown, requiredField = true): this {
    const v = str(value);
    if (v === undefined) {
      if (requiredField) this.errors[field] = "Email is required";
      return this;
    }
    if (!EMAIL_REGEX.test(v)) this.errors[field] = "Enter a valid email address";
    return this;
  }

  url(field: string, value: unknown): this {
    const v = str(value);
    if (v !== undefined && !URL_REGEX.test(v)) {
      this.errors[field] = "Must start with http:// or https://";
    }
    return this;
  }

  minLength(field: string, value: unknown, min: number, label = field): this {
    const v = str(value);
    if (v !== undefined && v.length < min) {
      this.errors[field] = `${label} must be at least ${min} characters`;
    }
    return this;
  }

  range(field: string, value: unknown, min: number, max: number): this {
    const n = num(value);
    if (n !== undefined && (n < min || n > max)) {
      this.errors[field] = `Must be between ${min} and ${max}`;
    }
    return this;
  }

  custom(field: string, ok: boolean, message: string): this {
    if (!ok) this.errors[field] = message;
    return this;
  }

  throwIfFailed(message = "Please fix the highlighted fields"): void {
    if (Object.keys(this.errors).length) {
      throw new ApiError(400, message, this.errors);
    }
  }
}

/** Normalised pagination params from a query string. */
export const paginationOf = (
  params: URLSearchParams,
  defaults: { page?: number; limit?: number; maxLimit?: number } = {},
) => {
  const { page: dPage = 1, limit: dLimit = 12, maxLimit = 100 } = defaults;
  const page = Math.max(1, num(params.get("page")) ?? dPage);
  const limit = Math.min(maxLimit, Math.max(1, num(params.get("limit")) ?? dLimit));
  return { page, limit, skip: (page - 1) * limit };
};

/** Escapes a user string so it is safe inside a Mongo `$regex`. */
export const escapeRegex = (value: string): string =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
