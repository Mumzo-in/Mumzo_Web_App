import { createRouter, requirePermission } from "@/core";
import { getRoute, growthRoute, listRoute } from "./users.routes";
import { getUser, listUsers, usersGrowth } from "./users.service";

/** Customer directory. Read-only — guarded on `user:list`/`user:get`. */

const app = createRouter();

app.use("/*", requirePermission("user", "list"));
app.get("/:id", requirePermission("user", "get"));

// `/growth` is registered before `/{id}` — static paths must win over the
// param route, or a request for `/growth` would be read as `id: "growth"`.
const users = app
  .openapi(listRoute, async (c) => {
    const query = c.req.valid("query");
    const { data, meta } = await listUsers(query);
    return c.json({ success: true as const, data: { data, meta } }, 200);
  })
  .openapi(growthRoute, async (c) => {
    const { from, to } = c.req.valid("query");
    const data = await usersGrowth({ from, to });
    return c.json({ success: true as const, data }, 200);
  })
  .openapi(getRoute, async (c) => {
    const user = await getUser(c.req.valid("param").id);
    return c.json({ success: true as const, data: user }, 200);
  });

export default users;
