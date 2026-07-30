import { createRoute, z } from "@hono/zod-openapi";

import { commonErrorResponses, jsonContent, successSchema } from "@/core";
import {
  deviceIdParamSchema,
  deviceSchema,
  registerDeviceSchema,
} from "./devices.schema";

const TAG = "Platform | Devices";

export const registerDeviceRoute = createRoute({
  method: "post",
  path: "/",
  tags: [TAG],
  summary:
    "Register (or refresh) a push-notification device for the signed-in customer",
  request: {
    body: { content: { "application/json": { schema: registerDeviceSchema } } },
  },
  responses: {
    200: jsonContent(successSchema(deviceSchema), "Device registered"),
    ...commonErrorResponses,
  },
});

export const unregisterDeviceRoute = createRoute({
  method: "delete",
  path: "/{id}",
  tags: [TAG],
  summary: "Deactivate a device (logout)",
  request: { params: deviceIdParamSchema },
  responses: {
    200: jsonContent(
      successSchema(z.object({ id: z.string() })),
      "Deactivated",
    ),
    ...commonErrorResponses,
  },
});
