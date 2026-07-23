import { createRoute, z } from "@hono/zod-openapi";

import { authErrorResponses, jsonContent, successSchema } from "@/core";
import { sessionIdParamSchema, uploadResponseSchema } from "./uploads.schema";

const TAG = "Admin | Uploads";

/**
 * No `request.body` here — the body is `multipart/form-data`, which
 * `@hono/zod-openapi`'s `createRoute` does not model cleanly. The handler in
 * `uploads.module.ts` parses the form with `c.req.parseBody()` and validates
 * it against `uploadFormSchema` directly.
 */
export const uploadRoute = createRoute({
  method: "post",
  path: "/",
  tags: [TAG],
  summary: "Upload an image (processed to WebP, stored as a draft)",
  security: [{ cookieAuth: [] }],
  responses: {
    201: jsonContent(successSchema(uploadResponseSchema), "Uploaded"),
    ...authErrorResponses,
  },
});

export const discardSessionRoute = createRoute({
  method: "delete",
  path: "/sessions/{sessionId}",
  tags: [TAG],
  summary: "Discard a draft upload session",
  security: [{ cookieAuth: [] }],
  request: { params: sessionIdParamSchema },
  responses: {
    200: jsonContent(
      successSchema(z.object({ ok: z.literal(true) })),
      "Session discarded",
    ),
    ...authErrorResponses,
  },
});
