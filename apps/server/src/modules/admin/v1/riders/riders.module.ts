import { createRouter, requirePermission } from "@/core";
import {
  createRiderRoute,
  deleteRiderRoute,
  getRiderRoute,
  listRoute,
  rotateCodeRoute,
  updateRiderRoute,
} from "./riders.routes";
import {
  createRider,
  deleteRider,
  getRider,
  listRiders,
  rotateAccessCode,
  updateRider,
} from "./riders.service";

/** Delivery partners. Guarded on `fleet:*` — the resource the operations,
 * admin and superadmin roles already carry. */

const app = createRouter();

app.use("/*", requirePermission("fleet", "read"));
app.post("/", requirePermission("fleet", "assign"));
app.patch("/:id", requirePermission("fleet", "assign"));
app.post("/:id/rotate-code", requirePermission("fleet", "assign"));
app.delete("/:id", requirePermission("fleet", "assign"));

const riders = app
  .openapi(listRoute, async (c) => {
    const { data, meta } = await listRiders(c.req.valid("query"));
    return c.json({ success: true as const, data: { data, meta } }, 200);
  })
  .openapi(getRiderRoute, async (c) => {
    const data = await getRider(c.req.valid("param").id);
    return c.json({ success: true as const, data }, 200);
  })
  .openapi(createRiderRoute, async (c) => {
    const data = await createRider(c.req.valid("json"));
    return c.json({ success: true as const, data }, 200);
  })
  .openapi(updateRiderRoute, async (c) => {
    const data = await updateRider(
      c.req.valid("param").id,
      c.req.valid("json"),
    );
    return c.json({ success: true as const, data }, 200);
  })
  .openapi(rotateCodeRoute, async (c) => {
    const data = await rotateAccessCode(c.req.valid("param").id);
    return c.json({ success: true as const, data }, 200);
  })
  .openapi(deleteRiderRoute, async (c) => {
    const data = await deleteRider(c.req.valid("param").id);
    return c.json({ success: true as const, data }, 200);
  });

export default riders;
