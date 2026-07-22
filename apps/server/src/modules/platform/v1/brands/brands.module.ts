import { createRouter } from "@/core";
import { getRoute, listRoute } from "./brands.routes";
import { getPublicBrand, listPublicBrands } from "./brands.service";

/**
 * Public brand directory reads. Anonymous — mounted under `optionalAuth`
 * in `platform/v1/index.ts`, not gated behind it.
 */

const app = createRouter();

const brands = app
  .openapi(listRoute, async (c) =>
    c.json({ success: true as const, data: await listPublicBrands() }, 200),
  )
  .openapi(getRoute, async (c) => {
    const brand = await getPublicBrand(c.req.valid("param").slug);
    return c.json({ success: true as const, data: brand }, 200);
  });

export default brands;
