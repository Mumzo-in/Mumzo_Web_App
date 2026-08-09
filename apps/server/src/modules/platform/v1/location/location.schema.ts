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

export const serviceabilityQuerySchema = z.object({
  pincode: z
    .string()
    .regex(/^\d{6}$/, "Pincode must be 6 digits.")
    .openapi({
      param: { name: "pincode", in: "query" },
      example: "500034",
    }),
});

export const serviceabilityResultSchema = z
  .object({
    serviceable: z.boolean(),
    areaName: z.string().nullable(),
    hubName: z.string().nullable(),
    /** True for `express`/`outer_express` zone tiers — everything else
     * (`standard`, `national_fallback`) is scheduled-delivery-only. */
    expressAvailable: z.boolean(),
    etaMinutes: z.number().nullable(),
  })
  .openapi("ServiceabilityResult");

export const serviceAreaSchema = z
  .object({
    pincode: z.string(),
    name: z.string(),
    expressAvailable: z.boolean(),
    etaMinutes: z.number(),
    /** The serving hub's coordinates — used client-side to match a
     * geolocated coordinate to the nearest covered area. */
    lat: z.number().nullable(),
    lng: z.number().nullable(),
  })
  .openapi("ServiceArea");
