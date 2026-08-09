import { createRouter, requirePermission } from "@/core";
import {
  createRouteDef,
  deleteRouteDef,
  getRoute,
  listRoute,
  updateRouteDef,
} from "./hubs.routes";
import {
  createHub,
  deleteHub,
  getHub,
  listHubs,
  updateHub,
} from "./hubs.service";

/** Dark-store hubs. Every route is guarded on `hub:*`. */

const app = createRouter();

app.use("/*", requirePermission("hub", "read"));
app.post("/", requirePermission("hub", "create"));
app.patch("/:id", requirePermission("hub", "update"));
app.delete("/:id", requirePermission("hub", "delete"));

const hubs = app
  .openapi(listRoute, async (c) =>
    c.json({ success: true as const, data: await listHubs() }, 200),
  )
  .openapi(getRoute, async (c) => {
    const hub = await getHub(c.req.valid("param").id);
    return c.json({ success: true as const, data: hub }, 200);
  })
  .openapi(createRouteDef, async (c) => {
    const id = await createHub(c.req.valid("json"));
    return c.json({ success: true as const, data: { id } }, 201);
  })
  .openapi(updateRouteDef, async (c) => {
    await updateHub(c.req.valid("param").id, c.req.valid("json"));
    return c.json({ success: true as const, data: { ok: true as const } }, 200);
  })
  .openapi(deleteRouteDef, async (c) => {
    await deleteHub(c.req.valid("param").id);
    return c.json({ success: true as const, data: { ok: true as const } }, 200);
  });

export default hubs;
