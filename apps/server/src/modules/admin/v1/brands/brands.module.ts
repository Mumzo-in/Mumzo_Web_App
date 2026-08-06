import { createRouter, requirePermission } from "@/core";
import { unauthorized } from "@/core/errors";
import {
  createRouteDef,
  deleteRouteDef,
  getRoute,
  listRoute,
  updateRouteDef,
} from "./brands.routes";
import {
  createBrand,
  deleteBrand,
  getBrand,
  listBrands,
  updateBrand,
} from "./brands.service";

/** Brand directory. Every route is guarded on `brand:*`. */

const app = createRouter();

app.use("/*", requirePermission("brand", "read"));
app.post("/", requirePermission("brand", "create"));
app.patch("/:id", requirePermission("brand", "update"));
app.delete("/:id", requirePermission("brand", "delete"));

const brands = app
  .openapi(listRoute, async (c) => {
    const query = c.req.valid("query");
    const { data, meta } = await listBrands(query);
    return c.json({ success: true as const, data: { data, meta } }, 200);
  })
  .openapi(getRoute, async (c) => {
    const brand = await getBrand(c.req.valid("param").id);
    return c.json({ success: true as const, data: brand }, 200);
  })
  .openapi(createRouteDef, async (c) => {
    const user = c.get("user");
    if (!user) {
      throw unauthorized();
    }
    const id = await createBrand(c.req.valid("json"), user.id);
    return c.json({ success: true as const, data: { id } }, 201);
  })
  .openapi(updateRouteDef, async (c) => {
    const user = c.get("user");
    if (!user) {
      throw unauthorized();
    }
    await updateBrand(c.req.valid("param").id, c.req.valid("json"), user.id);
    return c.json({ success: true as const, data: { ok: true as const } }, 200);
  })
  .openapi(deleteRouteDef, async (c) => {
    await deleteBrand(c.req.valid("param").id);
    return c.json({ success: true as const, data: { ok: true as const } }, 200);
  });

export default brands;
