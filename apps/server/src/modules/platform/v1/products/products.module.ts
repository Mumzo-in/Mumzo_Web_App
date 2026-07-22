import { createRouter } from "@/core";
import { getRoute, listByCategoryRoute, listRoute } from "./products.routes";
import {
  getPublicProduct,
  listPublicProducts,
  listPublicProductsInCategory,
} from "./products.service";

/**
 * Public product reads. Anonymous — mounted under `optionalAuth` in
 * `platform/v1/index.ts`, not gated behind it.
 *
 * Two routers are exported: `products` (mounted at `/products`, for the
 * global list + detail) and `productsByCategory` (mounted at `/categories`,
 * so its route resolves to `GET /api/v1/categories/{slug}/products` per the
 * API plan, alongside the existing category directory routes).
 */

const app = createRouter();

const products = app
  .openapi(listRoute, async (c) => {
    const query = c.req.valid("query");
    const { data, meta } = await listPublicProducts({
      page: query.page,
      limit: query.limit,
      search: query.search,
      categorySlug: query.categorySlug,
      sort: query.sort,
      brands: query.brands,
      minPrice: query.minPrice,
      maxPrice: query.maxPrice,
      sizes: query.sizes,
      inStock: query.inStock,
    });
    return c.json({ success: true as const, data: { data, meta } }, 200);
  })
  .openapi(getRoute, async (c) => {
    const item = await getPublicProduct(c.req.valid("param").id);
    return c.json({ success: true as const, data: item }, 200);
  });

const categoryApp = createRouter();

const productsByCategory = categoryApp.openapi(
  listByCategoryRoute,
  async (c) => {
    const { slug } = c.req.valid("param");
    const query = c.req.valid("query");
    const { data, meta } = await listPublicProductsInCategory(slug, {
      page: query.page,
      limit: query.limit,
      search: query.search,
      sort: query.sort,
      brands: query.brands,
      minPrice: query.minPrice,
      maxPrice: query.maxPrice,
      sizes: query.sizes,
      inStock: query.inStock,
    });
    return c.json({ success: true as const, data: { data, meta } }, 200);
  },
);

export default products;
export { productsByCategory };
