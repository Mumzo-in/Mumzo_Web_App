import { createRouter } from "@/core";
import { getRoute, listRoute } from "./categories.routes";
import { getPublicCategory, listPublicCategories } from "./categories.service";

/**
 * Public category taxonomy reads. Anonymous — mounted under `optionalAuth`
 * in `platform/v1/index.ts`, not gated behind it.
 */

const app = createRouter();

const categories = app
  .openapi(listRoute, async (c) =>
    c.json({ success: true as const, data: await listPublicCategories() }, 200),
  )
  .openapi(getRoute, async (c) => {
    const category = await getPublicCategory(c.req.valid("param").slug);
    return c.json({ success: true as const, data: category }, 200);
  });

export default categories;
