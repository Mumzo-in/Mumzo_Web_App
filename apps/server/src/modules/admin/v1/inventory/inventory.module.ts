import { createRouter, requirePermission } from "@/core";
import {
  adjustRouteDef,
  listRoute,
  productVariantsRoute,
} from "./inventory.routes";
import {
  adjustInventory,
  getProductVariants,
  listInventory,
} from "./inventory.service";

/** Per-hub (per-variant) stock. Guarded on `inventory:read` / `inventory:adjust`. */

const app = createRouter();

app.use("/*", requirePermission("inventory", "read"));
app.put("/adjust", requirePermission("inventory", "adjust"));

const inventory = app
  .openapi(listRoute, async (c) => {
    const query = c.req.valid("query");
    const data = await listInventory(query);
    return c.json({ success: true as const, data }, 200);
  })
  .openapi(productVariantsRoute, async (c) => {
    const { productId } = c.req.valid("param");
    const data = await getProductVariants(productId);
    return c.json({ success: true as const, data }, 200);
  })
  .openapi(adjustRouteDef, async (c) => {
    await adjustInventory(c.req.valid("json"), c);
    return c.json({ success: true as const, data: { ok: true as const } }, 200);
  });

export default inventory;
