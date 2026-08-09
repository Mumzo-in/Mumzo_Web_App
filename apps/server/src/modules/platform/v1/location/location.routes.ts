import { createRoute } from "@hono/zod-openapi";

import { commonErrorResponses, jsonContent, successSchema } from "@/core";
import {
  autocompleteQuerySchema,
  placeDetailsSchema,
  placeSuggestionSchema,
  reverseQuerySchema,
  serviceAreaSchema,
  serviceabilityQuerySchema,
  serviceabilityResultSchema,
} from "./location.schema";

const TAG = "Platform | Location";

export const autocompleteRoute = createRoute({
  method: "get",
  path: "/autocomplete",
  tags: [TAG],
  summary: "Search places by free text (OpenStreetMap Nominatim)",
  request: { query: autocompleteQuerySchema },
  responses: {
    200: jsonContent(
      successSchema(placeSuggestionSchema.array()),
      "Matching places",
    ),
    ...commonErrorResponses,
  },
});

export const reverseRoute = createRoute({
  method: "get",
  path: "/reverse",
  tags: [TAG],
  summary: "Resolve coordinates to an address (OpenStreetMap Nominatim)",
  request: { query: reverseQuerySchema },
  responses: {
    200: jsonContent(successSchema(placeDetailsSchema), "Resolved address"),
    ...commonErrorResponses,
  },
});

export const serviceabilityRoute = createRoute({
  method: "get",
  path: "/serviceability",
  tags: [TAG],
  summary: "Check whether a pincode is a serviceable area",
  request: { query: serviceabilityQuerySchema },
  responses: {
    200: jsonContent(
      successSchema(serviceabilityResultSchema),
      "Serviceability result",
    ),
    ...commonErrorResponses,
  },
});

export const serviceAreasRoute = createRoute({
  method: "get",
  path: "/service-areas",
  tags: [TAG],
  summary: "List every active serviceable area",
  responses: {
    200: jsonContent(
      successSchema(serviceAreaSchema.array()),
      "Active service areas",
    ),
    ...commonErrorResponses,
  },
});
