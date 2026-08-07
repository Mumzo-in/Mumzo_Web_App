import { createRoute } from "@hono/zod-openapi";
import { authErrorResponses, jsonContent, paginatedSchema } from "@/core";
import {
  activityLogSchema,
  listActivityLogsQuerySchema,
} from "./activity-logs.schema";

const TAG = "Admin | Operations";

export const listRoute = createRoute({
  method: "get",
  path: "/",
  tags: [TAG],
  summary: "List staff activity and audit logs",
  security: [{ cookieAuth: [] }],
  request: { query: listActivityLogsQuerySchema },
  responses: {
    200: jsonContent(
      paginatedSchema(activityLogSchema),
      "Page of staff activity logs",
    ),
    ...authErrorResponses,
  },
});
