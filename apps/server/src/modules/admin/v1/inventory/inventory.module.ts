import { createRouter, requirePermission } from "@/core";
import { adjustRouteDef, listRoute } from "./inventory.routes";
import { adjustInventory, listInventory } from "./inventory.service";

/** Per-hub stock. Guarded on `inventory:read` / `inventory:adjust`. */

const app = createRouter();

app.use("/*", requirePermission("inventory", "read"));
app.put("/adjust", requirePermission("inventory", "adjust"));

const inventory = app
  .openapi(listRoute, async (c) => {
    const query = c.req.valid("query");
    const data = await listInventory(query);
    return c.json({ success: true as const, data }, 200);
  })
  .openapi(adjustRouteDef, async (c) => {
    await adjustInventory(c.req.valid("json"));
    return c.json({ success: true as const, data: { ok: true as const } }, 200);
  });

export default inventory;
