import { NextResponse } from "next/server";

export type ResponseMeta = {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

type ResponsePayload<T> = {
  statusCode: number;
  success: boolean;
  message: string;
  data?: T;
  meta?: ResponseMeta;
  /** Field-level validation errors. */
  errors?: Record<string, string>;
};

/**
 * Single response envelope for every route handler:
 * `{ success, message, data?, meta?, errors? }`
 */
export function sendResponse<T>(payload: ResponsePayload<T>) {
  const body: Record<string, unknown> = {
    success: payload.success,
    message: payload.message,
  };

  if (payload.data !== undefined) body.data = payload.data;
  if (payload.meta) body.meta = payload.meta;
  if (payload.errors) body.errors = payload.errors;

  return NextResponse.json(body, { status: payload.statusCode });
}

export const buildMeta = (
  total: number,
  page: number,
  limit: number,
): ResponseMeta => ({
  total,
  page,
  limit,
  totalPages: limit > 0 ? Math.ceil(total / limit) : 0,
});
