/**
 * Response shapes, as types.
 *
 * The runtime helpers and zod schemas that produce these live in
 * `core/response.ts` — this file is the type-level contract alone, so a
 * consumer that only needs the shape does not pull in zod.
 */

export type PageMeta = {
  page: number;
  limit: number;
  total: number;
  hasNext: boolean;
};

export type SuccessResponse<T> = {
  success: true;
  data: T;
  message?: string;
};

/** Note the nesting — `apps/admin/src/core/api/client.ts` depends on it. */
export type PaginatedResponse<T> = {
  success: true;
  data: {
    data: T[];
    meta: PageMeta;
  };
};

export type ErrorResponse = {
  success: false;
  error: {
    code: string;
    message: string;
  };
};

export type ApiResponse<T> = SuccessResponse<T> | ErrorResponse;
