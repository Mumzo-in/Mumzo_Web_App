import { createRouter } from "@/core";
import { autocompleteRoute, reverseRoute } from "./location.routes";
import { reverseGeocode, searchPlaces } from "./location.service";

/**
 * Geocoding proxy — keeps the OpenStreetMap Nominatim usage-policy User-Agent
 * and rate-limit handling server-side rather than exposing any key/identity
 * to the browser (there is no key; Nominatim is free, but it does require a
 * compliant server-side caller — see location.service.ts).
 */
const app = createRouter();

const location = app
  .openapi(autocompleteRoute, async (c) => {
    const { q } = c.req.valid("query");
    const results = await searchPlaces(q);
    return c.json({ success: true as const, data: results }, 200);
  })
  .openapi(reverseRoute, async (c) => {
    const { lat, lng } = c.req.valid("query");
    const result = await reverseGeocode(lat, lng);
    return c.json({ success: true as const, data: result }, 200);
  });

export default location;
