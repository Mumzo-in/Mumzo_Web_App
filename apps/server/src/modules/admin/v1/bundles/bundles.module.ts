import { createRouter, requirePermission } from "@/core";
import {
  createRouteDef,
  deleteRouteDef,
  getRoute,
  listRoute,
  updateRouteDef,
} from "./bundles.routes";
import {
  createBundle,
  deleteBundle,
  getBundle,
  listBundles,
  updateBundle,
} from "./bundles.service";

/** Bundles & combos. Every route is guarded on `bundle:*`. */

const app = createRouter();

app.use("/*", requirePermission("bundle", "read"));
app.post("/", requirePermission("bundle", "create"));
app.put("/:id", requirePermission("bundle", "update"));
app.delete("/:id", requirePermission("bundle", "delete"));

const bundles = app
  .openapi(listRoute, async (c) => {
    const query = c.req.valid("query");
    const { data, meta } = await listBundles(query);
    return c.json({ success: true as const, data: { data, meta } }, 200);
  })
  .openapi(getRoute, async (c) => {
    const bundle = await getBundle(c.req.valid("param").id);
    return c.json({ success: true as const, data: bundle }, 200);
  })
  .openapi(createRouteDef, async (c) => {
    const id = await createBundle(c.req.valid("json"));
    return c.json({ success: true as const, data: { id } }, 201);
  })
  .openapi(updateRouteDef, async (c) => {
    await updateBundle(c.req.valid("param").id, c.req.valid("json"));
    return c.json({ success: true as const, data: { ok: true as const } }, 200);
  })
  .openapi(deleteRouteDef, async (c) => {
    await deleteBundle(c.req.valid("param").id);
    return c.json({ success: true as const, data: { ok: true as const } }, 200);
  });

export default bundles;
