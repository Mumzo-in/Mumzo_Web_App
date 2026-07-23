/**
 * Typed fetch wrapper for the Mumzo admin API (`/api/v1/admin/*`).
 *
 * Speaks the envelope defined in docs/api/mumzo_api_plan.md:
 *   success → { success: true, data, message }
 *   failure → { success: false, error: { code, message } }
 *
 * The admin API is not built yet, so module `api/*.ts` files currently resolve
 * against mock data. They return these same shapes, so swapping a module to the
 * real endpoint is a one-file change.
 */

import { env } from "@mumzo/env/web";

/** Error codes the API plan defines. Unknown codes stay representable. */
export type ApiErrorCode =
  | "PRODUCT_OUT_OF_STOCK"
  | "COUPON_EXPIRED"
  | "COUPON_INVALID"
  | "COUPON_MIN_AMOUNT"
  | "COUPON_EXHAUSTED"
  | "ORDER_NOT_CANCELLABLE"
  | "PAYMENT_FAILED"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | (string & {});

export class ApiError extends Error {
  readonly code: ApiErrorCode;
  readonly status: number;

  constructor(code: ApiErrorCode, message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
  }
}

/** Pagination envelope: `?page&limit` → `{ data, meta }`. */
export type PageMeta = {
  page: number;
  limit: number;
  total: number;
  hasNext: boolean;
};

export type Paginated<T> = {
  data: T[];
  meta: PageMeta;
};

export type PageParams = {
  page?: number;
  limit?: number;
};

type SuccessEnvelope<T> = { success: true; data: T; message?: string };
type ErrorEnvelope = {
  success: false;
  error: { code: ApiErrorCode; message: string };
};
type Envelope<T> = SuccessEnvelope<T> | ErrorEnvelope;

function getServerUrl(url?: string): string {
  const DEFAULT_PROD_API = "https://api.mumzo.in";

  if (url && (url.startsWith("http://") || url.startsWith("https://"))) {
    if (!url.includes("localhost") && !url.includes("127.0.0.1")) {
      return url.endsWith("/") ? url.slice(0, -1) : url;
    }
  }

  if (typeof window !== "undefined") {
    if (window.location.hostname.endsWith("mumzo.in")) {
      return DEFAULT_PROD_API;
    }
    if (url && (url.startsWith("http://") || url.startsWith("https://"))) {
      return url.endsWith("/") ? url.slice(0, -1) : url;
    }
    return window.location.origin;
  }

  if (url && (url.startsWith("http://") || url.startsWith("https://"))) {
    return url.endsWith("/") ? url.slice(0, -1) : url;
  }

  return "http://localhost:3000";
}

const BASE_URL = `${getServerUrl(env.VITE_SERVER_URL)}/api/v1/admin`;

export type RequestOptions = {
  // PUT for full replacement (role permissions), PATCH for partial updates.
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  /** Appended as a query string; `undefined` values are dropped. */
  query?: Record<string, string | number | boolean | undefined>;
  signal?: AbortSignal;
};

function buildUrl(path: string, query: RequestOptions["query"]): string {
  const url = `${BASE_URL}${path}`;
  if (!query) {
    return url;
  }

  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined) {
      params.set(key, String(value));
    }
  }

  const qs = params.toString();
  return qs ? `${url}?${qs}` : url;
}

/**
 * Issues a request and unwraps the envelope. Resolves with `data`; throws
 * `ApiError` on a failure envelope, a non-OK status, or an unreadable body.
 */
export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { method = "GET", body, query, signal } = options;

  let response: Response;
  try {
    response = await fetch(buildUrl(path, query), {
      method,
      credentials: "include",
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
      signal,
    });
  } catch (cause) {
    if (cause instanceof DOMException && cause.name === "AbortError") {
      throw cause;
    }
    throw new ApiError("NETWORK_ERROR", "Could not reach the server.", 0);
  }

  let envelope: Envelope<T>;
  try {
    envelope = (await response.json()) as Envelope<T>;
  } catch {
    throw new ApiError(
      "INVALID_RESPONSE",
      `Server returned an unreadable response (${response.status}).`,
      response.status,
    );
  }

  if (!envelope.success) {
    throw new ApiError(
      envelope.error.code,
      envelope.error.message,
      response.status,
    );
  }

  if (!response.ok) {
    throw new ApiError(
      "UNEXPECTED_STATUS",
      `Request failed (${response.status}).`,
      response.status,
    );
  }

  return envelope.data;
}

/** Paginated GET. The list envelope nests `{ data, meta }` inside `data`. */
export function apiList<T>(
  path: string,
  params: PageParams &
    Record<string, string | number | boolean | undefined> = {},
): Promise<Paginated<T>> {
  return apiRequest<Paginated<T>>(path, { query: params });
}

/**
 * POSTs a `FormData` body (multipart uploads). Same envelope-unwrapping and
 * `ApiError` logic as `apiRequest`, but deliberately omits `Content-Type` —
 * the browser sets it (with the multipart boundary) when `body` is a
 * `FormData` instance, and setting it manually breaks the boundary.
 */
export async function apiUpload<T>(
  path: string,
  formData: FormData,
  opts: { signal?: AbortSignal } = {},
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method: "POST",
      credentials: "include",
      body: formData,
      signal: opts.signal,
    });
  } catch (cause) {
    if (cause instanceof DOMException && cause.name === "AbortError") {
      throw cause;
    }
    throw new ApiError("NETWORK_ERROR", "Could not reach the server.", 0);
  }

  let envelope: Envelope<T>;
  try {
    envelope = (await response.json()) as Envelope<T>;
  } catch {
    throw new ApiError(
      "INVALID_RESPONSE",
      `Server returned an unreadable response (${response.status}).`,
      response.status,
    );
  }

  if (!envelope.success) {
    throw new ApiError(
      envelope.error.code,
      envelope.error.message,
      response.status,
    );
  }

  if (!response.ok) {
    throw new ApiError(
      "UNEXPECTED_STATUS",
      `Request failed (${response.status}).`,
      response.status,
    );
  }

  return envelope.data;
}
