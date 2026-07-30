import { createRouter, requirePermission } from "@/core";
import {
  createRouteDef,
  deleteRouteDef,
  listRoute,
  updateRouteDef,
} from "./service-areas.routes";
import {
  createServiceArea,
  deleteServiceArea,
  listServiceAreas,
  updateServiceArea,
} from "./service-areas.service";

/** Pincode → hub mapping. Every route is guarded on `serviceArea:*`. */

const app = createRouter();

app.use("/*", requirePermission("serviceArea", "read"));
app.post("/", requirePermission("serviceArea", "create"));
app.patch("/:id", requirePermission("serviceArea", "update"));
app.delete("/:id", requirePermission("serviceArea", "delete"));

const serviceAreas = app
  .openapi(listRoute, async (c) =>
    c.json({ success: true as const, data: await listServiceAreas() }, 200),
  )
  .openapi(createRouteDef, async (c) => {
    const id = await createServiceArea(c.req.valid("json"));
    return c.json({ success: true as const, data: { id } }, 201);
  })
  .openapi(updateRouteDef, async (c) => {
    await updateServiceArea(c.req.valid("param").id, c.req.valid("json"));
    return c.json({ success: true as const, data: { ok: true as const } }, 200);
  })
  .openapi(deleteRouteDef, async (c) => {
    await deleteServiceArea(c.req.valid("param").id);
    return c.json({ success: true as const, data: { ok: true as const } }, 200);
  });

export default serviceAreas;
