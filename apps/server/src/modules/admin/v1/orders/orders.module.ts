import { createRouter, requirePermission } from "@/core";
import { unauthorized } from "@/core/errors";
import {
  assignRiderRoute,
  createRouteDef,
  deliveryLinkRoute,
  getRoute,
  listRoute,
  updateStatusRoute,
} from "./orders.routes";
import {
  assignOrderRider,
  createOrder,
  getOrder,
  getOrderDeliveryLink,
  listOrders,
  updateOrderStatus,
} from "./orders.service";

/** Order directory. Every route is guarded on `order:*`. */

const app = createRouter();

app.use("/*", requirePermission("order", "read"));
app.post("/", requirePermission("order", "create"));
app.patch("/:id/status", requirePermission("order", "update"));
app.post("/:id/assign-rider", requirePermission("order", "update"));

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
  .openapi(deliveryLinkRoute, async (c) => {
    const data = await getOrderDeliveryLink(c.req.valid("param").id);
    return c.json({ success: true as const, data }, 200);
  })
  .openapi(assignRiderRoute, async (c) => {
    const data = await assignOrderRider(
      c.req.valid("param").id,
      c.req.valid("json").riderId,
    );
    return c.json({ success: true as const, data }, 200);
  })
  .openapi(createRouteDef, async (c) => {
    const user = c.get("user");
    if (!user) {
      throw unauthorized();
    }
    const order = await createOrder(c.req.valid("json"), `admin:${user.id}`, c);
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
      c,
    );
    return c.json({ success: true as const, data: order }, 200);
  });

export default orders;
