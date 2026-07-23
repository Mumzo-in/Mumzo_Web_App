import { createRouter, requirePermission } from "@/core";
import { unauthorized } from "@/core/errors";
import {
  createRouteDef,
  deleteRouteDef,
  getRoute,
  listRoute,
  updateRouteDef,
} from "./products.routes";
import {
  createProduct,
  deleteProduct,
  getProduct,
  listProducts,
  updateProduct,
} from "./products.service";

/** Product directory. Every route is guarded on `product:*`. */

const app = createRouter();

app.use("/*", requirePermission("product", "read"));
app.post("/", requirePermission("product", "create"));
app.put("/:id", requirePermission("product", "update"));
app.delete("/:id", requirePermission("product", "delete"));

const products = app
  .openapi(listRoute, async (c) => {
    const query = c.req.valid("query");
    const { data, meta } = await listProducts(query);
    return c.json({ success: true as const, data: { data, meta } }, 200);
  })
  .openapi(getRoute, async (c) => {
    const product = await getProduct(c.req.valid("param").id);
    return c.json({ success: true as const, data: product }, 200);
  })
  .openapi(createRouteDef, async (c) => {
    const user = c.get("user");
    if (!user) {
      throw unauthorized();
    }
    const id = await createProduct(c.req.valid("json"), user.id);
    return c.json({ success: true as const, data: { id } }, 201);
  })
  .openapi(updateRouteDef, async (c) => {
    const user = c.get("user");
    if (!user) {
      throw unauthorized();
    }
    await updateProduct(c.req.valid("param").id, c.req.valid("json"), user.id);
    return c.json({ success: true as const, data: { ok: true as const } }, 200);
  })
  .openapi(deleteRouteDef, async (c) => {
    await deleteProduct(c.req.valid("param").id);
    return c.json({ success: true as const, data: { ok: true as const } }, 200);
  });

export default products;
