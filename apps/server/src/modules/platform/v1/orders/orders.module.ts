import { createRouter, requireAuth } from "@/core";
import { unauthorized } from "@/core/errors";
import {
  cancelOrderRoute,
  getOrderRoute,
  listOrdersRoute,
  orderSavingsRoute,
  placeOrderRoute,
} from "./orders.routes";
import {
  cancelOrder,
  getOrder,
  getOrderSavings,
  listOrders,
  placeOrder,
} from "./orders.service";

/** Orders always belong to a signed-in customer — unlike cart, there's no
 * guest path here (checkout itself is behind auth). */

const app = createRouter();

app.use("/*", requireAuth);

const orders = app
  .openapi(placeOrderRoute, async (c) => {
    const authUser = c.get("user");
    if (!authUser) throw unauthorized();
    const data = await placeOrder(authUser.id, c.req.valid("json"));
    return c.json({ success: true as const, data }, 201);
  })
  .openapi(orderSavingsRoute, async (c) => {
    const authUser = c.get("user");
    if (!authUser) throw unauthorized();
    const data = await getOrderSavings(authUser.id);
    return c.json({ success: true as const, data }, 200);
  })
  .openapi(listOrdersRoute, async (c) => {
    const authUser = c.get("user");
    if (!authUser) throw unauthorized();
    const { page, limit } = c.req.valid("query");
    const { data, meta } = await listOrders(authUser.id, { page, limit });
    return c.json({ success: true as const, data: { data, meta } }, 200);
  })
  .openapi(getOrderRoute, async (c) => {
    const authUser = c.get("user");
    if (!authUser) throw unauthorized();
    const data = await getOrder(authUser.id, c.req.valid("param").id);
    return c.json({ success: true as const, data }, 200);
  })
  .openapi(cancelOrderRoute, async (c) => {
    const authUser = c.get("user");
    if (!authUser) throw unauthorized();
    const data = await cancelOrder(
      authUser.id,
      c.req.valid("param").id,
      c.req.valid("json").reason,
    );
    return c.json({ success: true as const, data }, 200);
  });

export default orders;
