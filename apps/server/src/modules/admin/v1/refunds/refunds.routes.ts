import { createRoute, z } from "@hono/zod-openapi";

import { authErrorResponses, jsonContent, successSchema } from "@/core";
import { listRefundsQuerySchema, refundRowSchema } from "./refunds.schema";

const TAG = "Admin | Finance";

export const listRoute = createRoute({
  method: "get",
  path: "/",
  tags: [TAG],
  summary: "List refunds, optionally filtered by status",
  security: [{ cookieAuth: [] }],
  request: { query: listRefundsQuerySchema },
  responses: {
    200: jsonContent(successSchema(z.array(refundRowSchema)), "Refunds"),
    ...authErrorResponses,
  },
});
