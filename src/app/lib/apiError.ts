export class ApiError extends Error {
  statusCode: number;
  /** Field-level messages, keyed by field name. */
  errors?: Record<string, string>;

  constructor(
    statusCode: number,
    message: string,
    errors?: Record<string, string>,
  ) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    this.name = "ApiError";
  }
}

export const badRequest = (message: string, errors?: Record<string, string>) =>
  new ApiError(400, message, errors);

export const unauthorized = (message = "Unauthorized") =>
  new ApiError(401, message);

export const forbidden = (message = "Forbidden") => new ApiError(403, message);

export const notFound = (resource = "Resource") =>
  new ApiError(404, `${resource} not found`);

export const conflict = (message: string) => new ApiError(409, message);

export const tooManyRequests = (message = "Too many requests") =>
  new ApiError(429, message);
