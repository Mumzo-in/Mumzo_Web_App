import { createRouter, requirePermission } from "@/core";
import {
  createRouteDef,
  deleteRouteDef,
  getRoute,
  listRoute,
  reorderRouteDef,
  updateRouteDef,
} from "./categories.routes";
import {
  createCategory,
  deleteCategory,
  getCategory,
  listCategories,
  reorderCategories,
  updateCategory,
} from "./categories.service";

/**
 * Category taxonomy. Keyed by slug, not id — matches `@mumzo/schema`'s
 * `Category` and how the storefront addresses `/category/$slug`.
 */

const app = createRouter();

app.use("/*", requirePermission("category", "read"));
app.post("/", requirePermission("category", "create"));
app.put("/reorder", requirePermission("category", "update"));
app.patch("/:slug", requirePermission("category", "update"));
app.delete("/:slug", requirePermission("category", "delete"));

const categories = app
  .openapi(listRoute, async (c) =>
    c.json({ success: true as const, data: await listCategories() }, 200),
  )
  // Registered before `/{slug}` so the literal path wins the match.
  .openapi(reorderRouteDef, async (c) => {
    await reorderCategories(c.req.valid("json").slugs);
    return c.json({ success: true as const, data: { ok: true as const } }, 200);
  })
  .openapi(getRoute, async (c) => {
    const category = await getCategory(c.req.valid("param").slug);
    return c.json({ success: true as const, data: category }, 200);
  })
  .openapi(createRouteDef, async (c) => {
    const id = await createCategory(c.req.valid("json"));
    return c.json({ success: true as const, data: { id } }, 201);
  })
  .openapi(updateRouteDef, async (c) => {
    await updateCategory(c.req.valid("param").slug, c.req.valid("json"));
    return c.json({ success: true as const, data: { ok: true as const } }, 200);
  })
  .openapi(deleteRouteDef, async (c) => {
    await deleteCategory(c.req.valid("param").slug);
    return c.json({ success: true as const, data: { ok: true as const } }, 200);
  });

export default categories;
