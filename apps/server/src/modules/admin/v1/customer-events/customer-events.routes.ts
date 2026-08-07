import { createRoute } from "@hono/zod-openapi";

import { authErrorResponses, jsonContent, paginatedSchema } from "@/core";
import {
  adminCustomerEventSchema,
  listCustomerEventsQuerySchema,
} from "./customer-events.schema";

const TAG = "Admin | Customers";

export const listRoute = createRoute({
  method: "get",
  path: "/",
  tags: [TAG],
  summary: "List customer activity events across all users",
  security: [{ cookieAuth: [] }],
  request: { query: listCustomerEventsQuerySchema },
  responses: {
    200: jsonContent(
      paginatedSchema(adminCustomerEventSchema),
      "Page of customer activity events",
    ),
    ...authErrorResponses,
  },
});
