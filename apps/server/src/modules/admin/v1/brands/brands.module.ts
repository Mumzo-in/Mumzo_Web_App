import { createRouter, requirePermission } from "@/core";
import {
  createRouteDef,
  deleteRouteDef,
  listRoute,
  updateRouteDef,
} from "./brands.routes";
import {
  createBrand,
  deleteBrand,
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
    const { search } = c.req.valid("query");
    return c.json(
      { success: true as const, data: await listBrands(search) },
      200,
    );
  })
  .openapi(createRouteDef, async (c) => {
    const id = await createBrand(c.req.valid("json"));
    return c.json({ success: true as const, data: { id } }, 201);
  })
  .openapi(updateRouteDef, async (c) => {
    await updateBrand(c.req.valid("param").id, c.req.valid("json"));
    return c.json({ success: true as const, data: { ok: true as const } }, 200);
  })
  .openapi(deleteRouteDef, async (c) => {
    await deleteBrand(c.req.valid("param").id);
    return c.json({ success: true as const, data: { ok: true as const } }, 200);
  });

export default brands;
