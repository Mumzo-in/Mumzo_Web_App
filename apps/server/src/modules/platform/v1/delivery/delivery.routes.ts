import { createRoute } from "@hono/zod-openapi";

import {
  commonErrorResponses,
  errorSchema,
  jsonContent,
  successSchema,
} from "@/core";
import {
  deliveryCodeSchema,
  deliveryOutcomeSchema,
  deliveryRunSchema,
  deliveryStatusSchema,
  deliveryTokenParamSchema,
} from "./delivery.schema";

const TAG = "Delivery link";

/** A bad token 404s and a bad code 403s — both are ordinary outcomes on a
 * public link, so they must be declared or the handler serialises them as a
 * 500 instead. */
const deliveryErrorResponses = {
  400: jsonContent(errorSchema, "Delivery already closed"),
  403: jsonContent(errorSchema, "Code not recognised"),
  404: jsonContent(errorSchema, "Delivery link not found"),
  ...commonErrorResponses,
} as const;

export const statusRoute = createRoute({
  method: "get",
  path: "/{token}",
  tags: [TAG],
  summary: "Whether a delivery link is live (no customer data)",
  request: { params: deliveryTokenParamSchema },
  responses: {
    200: jsonContent(successSchema(deliveryStatusSchema), "Link status"),
    ...deliveryErrorResponses,
  },
});

export const unlockRoute = createRoute({
  method: "post",
  path: "/{token}/unlock",
  tags: [TAG],
  summary: "Exchange a rider access code for the delivery details",
  request: {
    params: deliveryTokenParamSchema,
    body: { content: { "application/json": { schema: deliveryCodeSchema } } },
  },
  responses: {
    200: jsonContent(successSchema(deliveryRunSchema), "Delivery details"),
    ...deliveryErrorResponses,
  },
});

export const completeRoute = createRoute({
  method: "post",
  path: "/{token}/outcome",
  tags: [TAG],
  summary: "Report the delivery outcome",
  request: {
    params: deliveryTokenParamSchema,
    body: {
      content: { "application/json": { schema: deliveryOutcomeSchema } },
    },
  },
  responses: {
    200: jsonContent(successSchema(deliveryRunSchema), "Delivery closed"),
    ...deliveryErrorResponses,
  },
});
