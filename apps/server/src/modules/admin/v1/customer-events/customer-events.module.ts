import { createRouter, requirePermission } from "@/core";
import { listRoute } from "./customer-events.routes";
import { listCustomerEvents } from "./customer-events.service";

/** Cross-customer activity feed — same `user:list` gate as the customer
 * directory, since this is just another view on customer data. */
const app = createRouter();

app.use("/*", requirePermission("user", "list"));

const customerEvents = app.openapi(listRoute, async (c) => {
  const query = c.req.valid("query");
  const { data, meta } = await listCustomerEvents(query);
  return c.json({ success: true as const, data: { data, meta } }, 200);
});

export default customerEvents;
