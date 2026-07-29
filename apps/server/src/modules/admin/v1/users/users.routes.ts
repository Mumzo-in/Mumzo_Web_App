import { createRoute, z } from "@hono/zod-openapi";

import {
  authErrorResponses,
  jsonContent,
  paginatedSchema,
  successSchema,
} from "@/core";
import {
  adminUserSchema,
  listUsersQuerySchema,
  userGrowthPointSchema,
  userGrowthQuerySchema,
  userIdParamSchema,
} from "./users.schema";

const TAG = "Admin | Customers";

export const listRoute = createRoute({
  method: "get",
  path: "/",
  tags: [TAG],
  summary: "List customers",
  security: [{ cookieAuth: [] }],
  request: { query: listUsersQuerySchema },
  responses: {
    200: jsonContent(paginatedSchema(adminUserSchema), "Page of customers"),
    ...authErrorResponses,
  },
});

export const growthRoute = createRoute({
  method: "get",
  path: "/growth",
  tags: [TAG],
  summary: "Daily signups with a running total, trailing N days",
  security: [{ cookieAuth: [] }],
  request: { query: userGrowthQuerySchema },
  responses: {
    200: jsonContent(
      successSchema(z.array(userGrowthPointSchema)),
      "Growth series",
    ),
    ...authErrorResponses,
  },
});

export const getRoute = createRoute({
  method: "get",
  path: "/{id}",
  tags: [TAG],
  summary: "Get a customer",
  security: [{ cookieAuth: [] }],
  request: { params: userIdParamSchema },
  responses: {
    200: jsonContent(successSchema(adminUserSchema), "The customer"),
    ...authErrorResponses,
  },
});
