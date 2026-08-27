import { createRoute, z } from "@hono/zod-openapi";

import { commonErrorResponses, jsonContent, successSchema } from "@/core";
import {
  deviceListQuerySchema,
  notificationLogEntrySchema,
  registeredDeviceSchema,
  templateInfoSchema,
  testSendResultSchema,
  testSendSchema,
} from "./notifications.schema";

const TAG = "Admin | Notifications";

export const listDevicesRoute = createRoute({
  method: "get",
  path: "/devices",
  tags: [TAG],
  summary: "List every registered push device (staff and customer)",
  security: [{ cookieAuth: [] }],
  request: { query: deviceListQuerySchema },
  responses: {
    200: jsonContent(
      successSchema(z.array(registeredDeviceSchema)),
      "Registered devices",
    ),
    ...commonErrorResponses,
  },
});

export const listTemplatesRoute = createRoute({
  method: "get",
  path: "/templates",
  tags: [TAG],
  summary: "List notification templates with their fields and a preview",
  security: [{ cookieAuth: [] }],
  request: {
    query: z.object({
      /** Defaults to staff-facing: customer templates have no registered
       * devices to deliver to yet, so testing one looks like a failure. */
      audience: z.enum(["staff", "customer", "all"]).default("staff"),
    }),
  },
  responses: {
    200: jsonContent(
      successSchema(z.array(templateInfoSchema)),
      "Registered templates",
    ),
    ...commonErrorResponses,
  },
});

export const testSendRoute = createRoute({
  method: "post",
  path: "/test-send",
  tags: [TAG],
  summary: "Send a real notification through the live queue, for testing",
  security: [{ cookieAuth: [] }],
  request: {
    body: { content: { "application/json": { schema: testSendSchema } } },
  },
  responses: {
    200: jsonContent(successSchema(testSendResultSchema), "Queued"),
    ...commonErrorResponses,
  },
});

export const listLogsRoute = createRoute({
  method: "get",
  path: "/logs",
  tags: [TAG],
  summary: "Recent delivery attempts",
  security: [{ cookieAuth: [] }],
  request: {
    query: z.object({
      limit: z.coerce.number().int().min(1).max(100).default(25),
    }),
  },
  responses: {
    200: jsonContent(
      successSchema(z.array(notificationLogEntrySchema)),
      "Recent notification log entries",
    ),
    ...commonErrorResponses,
  },
});
