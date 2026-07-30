import { createRouter, requirePermission } from "@/core";
import { unauthorized } from "@/core/errors";
import { getRoute, listRoute, updateStatusRoute } from "./orders.routes";
import { getOrder, listOrders, updateOrderStatus } from "./orders.service";

/** Order directory. Every route is guarded on `order:*`. */

const app = createRouter();

app.use("/*", requirePermission("order", "read"));
app.patch("/:id/status", requirePermission("order", "update"));

const orders = app
  .openapi(listRoute, async (c) => {
    const query = c.req.valid("query");
    const { data, meta } = await listOrders(query);
    return c.json({ success: true as const, data: { data, meta } }, 200);
  })
  .openapi(getRoute, async (c) => {
    const order = await getOrder(c.req.valid("param").id);
    return c.json({ success: true as const, data: order }, 200);
  })
  .openapi(updateStatusRoute, async (c) => {
    const user = c.get("user");
    if (!user) {
      throw unauthorized();
    }
    const order = await updateOrderStatus(
      c.req.valid("param").id,
      c.req.valid("json"),
      `admin:${user.id}`,
    );
    return c.json({ success: true as const, data: order }, 200);
  });

export default orders;
