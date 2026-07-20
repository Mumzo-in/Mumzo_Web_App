import { z } from "@hono/zod-openapi";
import type { Context } from "hono";

/**
 * Response builders and their matching zod schemas.
 *
 * Every response shares one wrapper — the "envelope" — so clients have a
 * single shape to parse:
 *
 *   single: { success: true, data: T }
 *   list:   { success: true, data: { data: T[], meta: PageMeta } }
 *   error:  { success: false, error: { code, message } }
 *
 * This is a committed contract: `apps/admin/src/core/api/client.ts` already
 * unwraps it. The list form nests, which looks redundant but the client
 * depends on it — do not "fix" it.
 *
 * Type-only versions live in `core/types/response.ts`.
 */

export const pageMetaSchema = z
  .object({
    page: z.number().int().openapi({ example: 1 }),
    limit: z.number().int().openapi({ example: 20 }),
    total: z.number().int().openapi({ example: 150 }),
    hasNext: z.boolean().openapi({ example: true }),
  })
  .openapi("PageMeta");

/**
 * Wraps a schema in the success envelope, for `createRoute` responses.
 *
 *   responses: { 200: jsonContent(successSchema(productSchema), "The product") }
 */
export const successSchema = <T extends z.ZodTypeAny>(data: T) =>
  z.object({
    success: z.literal(true),
    data,
    message: z.string().optional(),
  });

/** Wraps a schema in the *nested* paginated envelope. */
export const paginatedSchema = <T extends z.ZodTypeAny>(item: T) =>
  z.object({
    success: z.literal(true),
    data: z.object({
      data: z.array(item),
      meta: pageMetaSchema,
    }),
  });

export const errorSchema = z
  .object({
    success: z.literal(false),
    error: z.object({
      code: z.string().openapi({ example: "NOT_FOUND" }),
      message: z.string().openapi({ example: "Product not found" }),
    }),
  })
  .openapi("ErrorResponse");

export function ok<T>(c: Context, data: T, message?: string) {
  return c.json({
    success: true as const,
    data,
    ...(message ? { message } : {}),
  });
}

export function okPaginated<T>(
  c: Context,
  rows: T[],
  total: number,
  page: number,
  limit: number,
) {
  return c.json({
    success: true as const,
    data: {
      data: rows,
      meta: { page, limit, total, hasNext: page * limit < total },
    },
  });
}
