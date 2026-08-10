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

/**
 * `listPublicProducts`/`listPublicProductsInCategory` never vary by
 * session — they don't look at `c.var.user` — so the response body is
 * identical for every caller hitting the same URL. A short public cache
 * absorbs repeat identical searches/listings (e.g. many shoppers browsing
 * the same category, or a search term trending) without re-running the
 * trigram-scored fuzzy-search query — the most expensive read on this
 * surface — for each one. `stale-while-revalidate` keeps a cache hit fast
 * while a background revalidation picks up genuinely new products.
 *
 * Deliberately NOT applied to `getPublicProduct` (the single-product detail
 * route) — it carries live per-size stock, and a stale "in stock" badge on
 * the product page for the cache TTL is a worse failure mode than the
 * staleness this buys on a browse/search grid, where checkout re-validates
 * stock server-side regardless.
 */
const LIST_CACHE_CONTROL = "public, max-age=30, stale-while-revalidate=300";

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
      bestseller: query.bestseller,
      topDeal: query.topDeal,
    });
    c.header("Cache-Control", LIST_CACHE_CONTROL);
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
    c.header("Cache-Control", LIST_CACHE_CONTROL);
    return c.json({ success: true as const, data: { data, meta } }, 200);
  },
);

export default products;
export { productsByCategory };
