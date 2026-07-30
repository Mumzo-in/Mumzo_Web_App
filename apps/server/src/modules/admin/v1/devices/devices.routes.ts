import { createRoute, z } from "@hono/zod-openapi";

import { commonErrorResponses, jsonContent, successSchema } from "@/core";
import {
  registerStaffDeviceSchema,
  staffDeviceIdParamSchema,
  staffDeviceSchema,
} from "./devices.schema";

const TAG = "Admin | Devices";

export const registerStaffDeviceRoute = createRoute({
  method: "post",
  path: "/",
  tags: [TAG],
  summary:
    "Register (or refresh) a push-notification device for the signed-in staff member",
  security: [{ cookieAuth: [] }],
  request: {
    body: {
      content: { "application/json": { schema: registerStaffDeviceSchema } },
    },
  },
  responses: {
    200: jsonContent(successSchema(staffDeviceSchema), "Device registered"),
    ...commonErrorResponses,
  },
});

export const unregisterStaffDeviceRoute = createRoute({
  method: "delete",
  path: "/{id}",
  tags: [TAG],
  summary: "Deactivate a staff device (logout)",
  security: [{ cookieAuth: [] }],
  request: { params: staffDeviceIdParamSchema },
  responses: {
    200: jsonContent(
      successSchema(z.object({ id: z.string() })),
      "Deactivated",
    ),
    ...commonErrorResponses,
  },
});
