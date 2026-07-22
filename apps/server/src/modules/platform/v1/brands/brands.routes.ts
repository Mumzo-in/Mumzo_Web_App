import { createRoute, z } from "@hono/zod-openapi";

import { commonErrorResponses, jsonContent, successSchema } from "@/core";
import { brandSlugParamSchema, publicBrandSchema } from "./brands.schema";

const TAG = "Platform | Catalog";

export const listRoute = createRoute({
  method: "get",
  path: "/",
  tags: [TAG],
  summary: "List active brands",
  responses: {
    200: jsonContent(
      successSchema(z.array(publicBrandSchema)),
      "Active brands",
    ),
    ...commonErrorResponses,
  },
});

export const getRoute = createRoute({
  method: "get",
  path: "/{slug}",
  tags: [TAG],
  summary: "Get an active brand by slug",
  request: { params: brandSlugParamSchema },
  responses: {
    200: jsonContent(successSchema(publicBrandSchema), "The brand"),
    ...commonErrorResponses,
  },
});
