import { z } from "@hono/zod-openapi";

export const autocompleteQuerySchema = z.object({
  q: z
    .string()
    .trim()
    .min(2)
    .max(200)
    .openapi({
      param: { name: "q", in: "query" },
      example: "Banjara Hills",
    }),
});

export const reverseQuerySchema = z.object({
  lat: z.coerce
    .number()
    .min(-90)
    .max(90)
    .openapi({
      param: { name: "lat", in: "query" },
      example: 17.4156,
    }),
  lng: z.coerce
    .number()
    .min(-180)
    .max(180)
    .openapi({
      param: { name: "lng", in: "query" },
      example: 78.4347,
    }),
});

export const placeSuggestionSchema = z
  .object({
    label: z.string(),
    lat: z.number(),
    lng: z.number(),
  })
  .openapi("PlaceSuggestion");

export const placeDetailsSchema = z
  .object({
    formattedAddress: z.string(),
    pincode: z.string(),
    city: z.string(),
    lat: z.number(),
    lng: z.number(),
  })
  .openapi("PlaceDetails");
