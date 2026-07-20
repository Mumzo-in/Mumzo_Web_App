import type { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import { ZodError } from "zod";

import { ERROR_CODES, type ErrorCode } from "./constants";

/** Throw this; never build an error body by hand. `onError` renders it. */
export class AppError extends Error {
  constructor(
    public readonly code: ErrorCode,
    message: string,
    public readonly status: ContentfulStatusCode = 400,
    /** Logged, never serialized to the client. */
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export const badRequest = (
  message: string,
  code: ErrorCode = ERROR_CODES.VALIDATION_ERROR,
) => new AppError(code, message, 400);

export const notFound = (what: string) =>
  new AppError(ERROR_CODES.NOT_FOUND, `${what} not found`, 404);

export const unauthorized = (message = "Authentication required") =>
  new AppError(ERROR_CODES.UNAUTHORIZED, message, 401);

export const forbidden = (message = "Insufficient permissions") =>
  new AppError(ERROR_CODES.FORBIDDEN, message, 403);

export const conflict = (message: string) =>
  new AppError(ERROR_CODES.CONFLICT, message, 409);

type ErrorBody = {
  success: false;
  error: { code: string; message: string };
};

const body = (code: string, message: string): ErrorBody => ({
  success: false,
  error: { code, message },
});

/**
 * Formats a ZodError into one readable message. Reports the first issue with
 * its path — "price: Expected number, received string" beats a bare
 * "Invalid input" when you are debugging a client.
 */
export function formatZodError(err: ZodError): string {
  const issue = err.issues[0];

  if (!issue) {
    return "Invalid request";
  }

  const path = issue.path.join(".");

  return path ? `${path}: ${issue.message}` : issue.message;
}

/**
 * The single place error responses are produced. Registered via `app.onError`,
 * so any thrown error anywhere becomes a correctly-shaped envelope.
 */
export function errorHandler(err: Error, c: Context) {
  const requestId = c.get("requestId") ?? "-";

  if (err instanceof AppError) {
    if (err.details) {
      console.error(`[${requestId}] ${err.code}:`, err.details);
    }

    return c.json(body(err.code, err.message), err.status);
  }

  if (err instanceof ZodError) {
    return c.json(body(ERROR_CODES.VALIDATION_ERROR, formatZodError(err)), 422);
  }

  if (err instanceof HTTPException) {
    // Hono's own errors (body-limit, malformed JSON). 4xx are the client's
    // fault and safe to echo; 5xx are ours and must not leak internals.
    const code =
      err.status >= 500
        ? ERROR_CODES.INTERNAL_ERROR
        : ERROR_CODES.VALIDATION_ERROR;

    return c.json(body(code, err.message), err.status);
  }

  // Unexpected: log with the request id, tell the client nothing. Leaking a
  // stack trace or a driver message is an information disclosure bug.
  console.error(`[${requestId}] Unhandled error:`, err);

  return c.json(body(ERROR_CODES.INTERNAL_ERROR, "Something went wrong"), 500);
}

/** Unmatched routes must still return the envelope, not Hono's plain text. */
export function notFoundHandler(c: Context) {
  return c.json(body(ERROR_CODES.NOT_FOUND, "Route not found"), 404);
}
