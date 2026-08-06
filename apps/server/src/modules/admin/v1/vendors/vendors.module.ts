import { createRouter, requirePermission } from "@/core";
import {
  createRouteDef,
  deleteRouteDef,
  getRoute,
  listRoute,
  listVendorProductsRoute,
  updateRouteDef,
} from "./vendors.routes";
import {
  createVendor,
  deleteVendor,
  getVendor,
  listVendorProducts,
  listVendors,
  updateVendor,
} from "./vendors.service";

/** Vendor directory. Every route is guarded on `vendor:*`. */

const app = createRouter();

app.use("/*", requirePermission("vendor", "read"));
app.post("/", requirePermission("vendor", "create"));
app.patch("/:id", requirePermission("vendor", "update"));
app.delete("/:id", requirePermission("vendor", "delete"));

const vendors = app
  .openapi(listRoute, async (c) => {
    const query = c.req.valid("query");
    const { data, meta } = await listVendors(query);
    return c.json({ success: true as const, data: { data, meta } }, 200);
  })
  .openapi(getRoute, async (c) => {
    const vendor = await getVendor(c.req.valid("param").id);
    return c.json({ success: true as const, data: vendor }, 200);
  })
  .openapi(createRouteDef, async (c) => {
    const id = await createVendor(c.req.valid("json"));
    return c.json({ success: true as const, data: { id } }, 201);
  })
  .openapi(updateRouteDef, async (c) => {
    await updateVendor(c.req.valid("param").id, c.req.valid("json"));
    return c.json({ success: true as const, data: { ok: true as const } }, 200);
  })
  .openapi(deleteRouteDef, async (c) => {
    await deleteVendor(c.req.valid("param").id);
    return c.json({ success: true as const, data: { ok: true as const } }, 200);
  })
  .openapi(listVendorProductsRoute, async (c) => {
    const { id } = c.req.valid("param");
    const query = c.req.valid("query");
    const { data, meta } = await listVendorProducts(id, query);
    return c.json({ success: true as const, data: { data, meta } }, 200);
  });

export default vendors;
