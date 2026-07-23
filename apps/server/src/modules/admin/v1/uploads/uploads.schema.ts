import { z } from "@hono/zod-openapi";

/**
 * `@hono/zod-openapi`'s `createRoute` request-body validation targets JSON
 * request bodies; it does not cleanly model `multipart/form-data`. The
 * upload routes therefore skip `request.body` in their `createRoute` defs
 * and validate the parsed form fields manually with this schema inside the
 * handler (see `uploads.module.ts`) — still validated, just not through the
 * OpenAPI request-body schema.
 */
export const uploadFormSchema = z.object({
  entity: z.enum([
    "products",
    "categories",
    "brands",
    "users",
    "reviews",
    "invoices",
    "exports",
  ]),
  slot: z
    .string()
    .min(1)
    .max(60)
    .regex(/^[a-z0-9-]+$/, "Lowercase letters, numbers and hyphens only."),
  sessionId: z.uuid().optional(),
});

export const uploadResponseSchema = z
  .object({
    key: z.string(),
    url: z.string(),
    sessionId: z.uuid(),
    resizeable: z.boolean(),
    sizeBytes: z.number().int(),
  })
  .openapi("UploadResponse");

export const sessionIdParamSchema = z.object({
  sessionId: z.uuid().openapi({ param: { name: "sessionId", in: "path" } }),
});
