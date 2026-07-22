import { createRoute, z } from "@hono/zod-openapi";

import { commonErrorResponses, jsonContent, successSchema } from "@/core";
import {
  categorySlugParamSchema,
  publicCategorySchema,
} from "./categories.schema";

const TAG = "Platform | Catalog";

export const listRoute = createRoute({
  method: "get",
  path: "/",
  tags: [TAG],
  summary: "List active categories, ordered by merchandising position",
  responses: {
    200: jsonContent(
      successSchema(z.array(publicCategorySchema)),
      "Active categories",
    ),
    ...commonErrorResponses,
  },
});

export const getRoute = createRoute({
  method: "get",
  path: "/{slug}",
  tags: [TAG],
  summary: "Get an active category by slug",
  request: { params: categorySlugParamSchema },
  responses: {
    200: jsonContent(successSchema(publicCategorySchema), "The category"),
    ...commonErrorResponses,
  },
});
