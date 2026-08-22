import { createRouter, requirePermission } from "@/core";
import { unauthorized } from "@/core/errors";
import {
  createRouteDef,
  deleteRouteDef,
  getRoute,
  listRoute,
  riderOptionsRoute,
  summaryRoute,
  updateRouteDef,
} from "./expenses.routes";
import {
  createExpense,
  deleteExpense,
  expenseSummary,
  getExpense,
  listExpenses,
  listRiderOptions,
  updateExpense,
} from "./expenses.service";

/** Business expense ledger. Every route is guarded on `expense:*`. */

const app = createRouter();

app.use("/*", requirePermission("expense", "read"));
app.post("/", requirePermission("expense", "create"));
app.patch("/:id", requirePermission("expense", "update"));
app.delete("/:id", requirePermission("expense", "delete"));

const expenses = app
  .openapi(listRoute, async (c) => {
    const query = c.req.valid("query");
    const { data, meta } = await listExpenses(query);
    return c.json({ success: true as const, data: { data, meta } }, 200);
  })
  .openapi(summaryRoute, async (c) => {
    const query = c.req.valid("query");
    const summary = await expenseSummary(query);
    return c.json({ success: true as const, data: summary }, 200);
  })
  .openapi(riderOptionsRoute, async (c) =>
    c.json({ success: true as const, data: await listRiderOptions() }, 200),
  )
  .openapi(getRoute, async (c) => {
    const expense = await getExpense(c.req.valid("param").id);
    return c.json({ success: true as const, data: expense }, 200);
  })
  .openapi(createRouteDef, async (c) => {
    const user = c.get("user");
    if (!user) {
      throw unauthorized();
    }
    const expense = await createExpense(c.req.valid("json"), user.id);
    return c.json({ success: true as const, data: expense }, 201);
  })
  .openapi(updateRouteDef, async (c) => {
    const expense = await updateExpense(
      c.req.valid("param").id,
      c.req.valid("json"),
    );
    return c.json({ success: true as const, data: expense }, 200);
  })
  .openapi(deleteRouteDef, async (c) => {
    await deleteExpense(c.req.valid("param").id);
    return c.json({ success: true as const, data: { ok: true as const } }, 200);
  });

export default expenses;
