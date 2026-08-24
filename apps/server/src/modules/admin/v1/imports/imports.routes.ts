import { createRoute } from "@hono/zod-openapi";

import { authErrorResponses, jsonContent, successSchema } from "@/core";
import {
  createJobResponseSchema,
  importJobSchema,
  jobErrorsQuerySchema,
  jobIdParamSchema,
  resolveJobBodySchema,
  resolveJobResponseSchema,
  rowErrorSchema,
  runJobResponseSchema,
  validateJobBodySchema,
  validateJobResponseSchema,
} from "./imports.schema";

const TAG = "Admin | Imports";

export const uploadRouteDef = createRoute({
  method: "post",
  path: "/",
  tags: [TAG],
  summary: "Upload a product import sheet (multipart/form-data, field `file`)",
  security: [{ cookieAuth: [] }],
  responses: {
    201: jsonContent(successSchema(createJobResponseSchema), "Parsed sheet"),
    ...authErrorResponses,
  },
});

export const getJobRoute = createRoute({
  method: "get",
  path: "/{id}",
  tags: [TAG],
  summary: "Get an import job's status/progress",
  security: [{ cookieAuth: [] }],
  request: { params: jobIdParamSchema },
  responses: {
    200: jsonContent(successSchema(importJobSchema), "The job"),
    ...authErrorResponses,
  },
});

export const validateJobRoute = createRoute({
  method: "post",
  path: "/{id}/validate",
  tags: [TAG],
  summary: "Confirm column mapping and validate all rows",
  security: [{ cookieAuth: [] }],
  request: {
    params: jobIdParamSchema,
    body: {
      content: { "application/json": { schema: validateJobBodySchema } },
    },
  },
  responses: {
    200: jsonContent(
      successSchema(validateJobResponseSchema),
      "Validation result",
    ),
    ...authErrorResponses,
  },
});

export const resolveJobRoute = createRoute({
  method: "post",
  path: "/{id}/resolve",
  tags: [TAG],
  summary:
    "Apply create/link/skip decisions for unresolved brand/category names",
  security: [{ cookieAuth: [] }],
  request: {
    params: jobIdParamSchema,
    body: { content: { "application/json": { schema: resolveJobBodySchema } } },
  },
  responses: {
    200: jsonContent(successSchema(resolveJobResponseSchema), "Resolved"),
    ...authErrorResponses,
  },
});

export const runJobRoute = createRoute({
  method: "post",
  path: "/{id}/run",
  tags: [TAG],
  summary: "Run the chunked import for every ready product",
  security: [{ cookieAuth: [] }],
  request: { params: jobIdParamSchema },
  responses: {
    200: jsonContent(successSchema(runJobResponseSchema), "Import complete"),
    ...authErrorResponses,
  },
});

export const getJobErrorsRoute = createRoute({
  method: "get",
  path: "/{id}/errors",
  tags: [TAG],
  summary: "Paginated per-row failure report for a job",
  security: [{ cookieAuth: [] }],
  request: { params: jobIdParamSchema, query: jobErrorsQuerySchema },
  responses: {
    200: jsonContent(successSchema(rowErrorSchema.array()), "Row errors"),
    ...authErrorResponses,
  },
});
