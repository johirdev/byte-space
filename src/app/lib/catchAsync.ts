import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { ApiError } from "./apiError";
import { sendResponse } from "./sendResponse";
import { connectDB } from "./db";

type Handler<Ctx> = (req: NextRequest, ctx: Ctx) => Promise<NextResponse>;

const isProd = process.env.NODE_ENV === "production";

/** Turns a thrown value into the API error envelope. */
export function toErrorResponse(err: unknown): NextResponse {
  if (err instanceof ApiError) {
    return sendResponse({
      statusCode: err.statusCode,
      success: false,
      message: err.message,
      errors: err.errors,
    });
  }

  // Mongoose schema validation
  if (err instanceof mongoose.Error.ValidationError) {
    const errors: Record<string, string> = {};
    for (const [field, detail] of Object.entries(err.errors)) {
      errors[field] = detail.message;
    }
    return sendResponse({
      statusCode: 400,
      success: false,
      message: "Validation failed",
      errors,
    });
  }

  // Bad ObjectId
  if (err instanceof mongoose.Error.CastError) {
    return sendResponse({
      statusCode: 400,
      success: false,
      message: `Invalid ${err.path}: ${String(err.value)}`,
    });
  }

  // Duplicate key
  if (
    typeof err === "object" &&
    err !== null &&
    (err as { code?: number }).code === 11000
  ) {
    const keys = Object.keys(
      (err as { keyValue?: Record<string, unknown> }).keyValue ?? {},
    );
    const field = keys[0] ?? "value";
    return sendResponse({
      statusCode: 409,
      success: false,
      message: `${field} already exists`,
      errors: { [field]: "Already in use" },
    });
  }

  if (!isProd) console.error("[api] unhandled error:", err);

  return sendResponse({
    statusCode: 500,
    success: false,
    message: isProd
      ? "Something went wrong. Please try again."
      : err instanceof Error
        ? err.message
        : "Internal server error",
  });
}

/**
 * Wraps a route handler with DB connection + uniform error handling, so
 * handlers can just `throw new ApiError(...)` and return happy-path JSON.
 *
 *   export const GET = route(async (req, ctx: RouteContext<'/api/v1/blog/[id]'>) => { ... })
 */
export function route<Ctx = unknown>(handler: Handler<Ctx>) {
  return async (req: NextRequest, ctx: Ctx): Promise<NextResponse> => {
    try {
      await connectDB();
      return await handler(req, ctx);
    } catch (err) {
      return toErrorResponse(err);
    }
  };
}

/** Safely parses a JSON body, rejecting malformed payloads. */
export async function readJson<T = Record<string, unknown>>(
  req: NextRequest,
): Promise<T> {
  try {
    return (await req.json()) as T;
  } catch {
    throw new ApiError(400, "Request body must be valid JSON");
  }
}
