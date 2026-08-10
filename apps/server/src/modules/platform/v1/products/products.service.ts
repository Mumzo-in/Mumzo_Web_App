import { notFound } from "@/core/errors";
import { toPaise, toWholeRupees } from "@/lib/money";
import {
  colorsByProductId,
  inventoryStockByProductIds,
  sizesByProductId,
} from "@/modules/admin/v1/products/products.repo";
import type { PublicSort } from "./products.repo";
import * as productsRepo from "./products.repo";

/** Wider than what's serialized to the public API — `sizesByProductId`/
 * `colorsByProductId` (shared with the admin repo) also carry `sku`/`mrp`/
 * `costPrice` now, but the customer-facing response below picks only
 * `id`/`label`/`price` per variant so vendor cost never leaks. Stock isn't
 * here at all — it never lived on these rows meaningfully, only in
 * `inventory` (per hub), so it's looked up separately and merged in. */
type Size = {
  id: string;
  label: string;
  price: number;
  mrp: number;
  costPrice: number | null;
};
type Color = Size;

type PublicVariant = {
  id: string;
  label: string;
  price: number;
  stock: number;
};

/** Picks only the customer-facing fields — never `sku`/`costPrice` — and
 * attaches live stock, summed across active hubs, keyed by variant id. */
function toPublicVariant(
  variant: Size,
  productId: string,
  axis: "size" | "color",
  stockByKey: Map<string, number>,
): PublicVariant {
  const key =
    axis === "size"
      ? `${productId}:${variant.id}:`
      : `${productId}::${variant.id}`;
  return {
    id: variant.id,
    label: variant.label,
    price: toWholeRupees(variant.price),
    stock: stockByKey.get(key) ?? 0,
  };
}

type ProductRow = Awaited<ReturnType<typeof productsRepo.findPublicById>>;

function serialize(
  row: NonNullable<ProductRow>,
  sizesInPaise: Size[],
  colorsInPaise: Color[],
  stockByKey: Map<string, number>,
) {
  const sizes = sizesInPaise.map((s) =>
    toPublicVariant(s, row.id, "size", stockByKey),
  );
  const colors = colorsInPaise.map((c) =>
    toPublicVariant(c, row.id, "color", stockByKey),
  );
  // No variants at all — stock lives on the product-less inventory row.
  const noVariantStock = stockByKey.get(`${row.id}::`) ?? 0;
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    brand: row.brandName,
    brandSlug: row.brandSlug,
    categorySlug: row.categorySlug,
    price: toWholeRupees(row.price),
    mrp: toWholeRupees(row.mrp),
    qty: row.qty,
    description: row.description,
    about: row.about,
    highlights: row.highlights,
    countryOfOrigin: row.countryOfOrigin,
    images: row.images,
    sizes,
    colors,
    ages: row.ages,
    type: row.type,
    tags: row.tags,
    stock:
      sizes.length > 0
        ? sizes.reduce((sum, s) => sum + s.stock, 0)
        : colors.length > 0
          ? colors.reduce((sum, c) => sum + c.stock, 0)
          : noVariantStock,
    rating: Number(row.rating),
    isBestseller: row.isBestseller,
    isTopDeal: row.isTopDeal,
    updatedAt: row.updatedAt.toISOString(),
  };
}

export type ListPublicProductsFilters = {
  page: number;
  limit: number;
  search?: string;
  categorySlug?: string;
  sort: PublicSort;
  brands?: string[];
  minPrice?: number;
  maxPrice?: number;
  sizes?: string[];
  inStock?: boolean;
  bestseller?: boolean;
  topDeal?: boolean;
};

/**
 * `sizes`/`inStock` filter on `productSize` rows, which the page query
 * itself can't express without changing the row shape returned per page —
 * simplest correct approach is to over-fetch the page from the DB query
 * (price/brand/category/search/sort already narrowed it), then drop rows
 * that don't match once sizes are loaded. Good enough at today's catalog
 * size; a compound filter would move `sizes`/`inStock` server-side into
 * `findPublicPage` on the next pass.
 */
export async function listPublicProducts(filters: ListPublicProductsFilters) {
  const { rows, total } = await productsRepo.findPublicPage({
    page: filters.page,
    limit: filters.limit,
    search: filters.search,
    categorySlug: filters.categorySlug,
    brandSlugs: filters.brands,
    // Client sends whole rupees; the DB stores paise (see lib/money.ts).
    minPrice:
      filters.minPrice === undefined ? undefined : toPaise(filters.minPrice),
    maxPrice:
      filters.maxPrice === undefined ? undefined : toPaise(filters.maxPrice),
    sort: filters.sort,
    bestseller: filters.bestseller,
    topDeal: filters.topDeal,
  });

  const productIds = rows.map((row) => row.id);
  const [sizesByProduct, colorsByProduct, stockByKey] = await Promise.all([
    sizesByProductId(productIds),
    colorsByProductId(productIds),
    inventoryStockByProductIds(productIds),
  ]);

  let data = rows.map((row) =>
    serialize(
      row,
      sizesByProduct.get(row.id) ?? [],
      colorsByProduct.get(row.id) ?? [],
      stockByKey,
    ),
  );

  if (filters.sizes && filters.sizes.length > 0) {
    const wanted = new Set(filters.sizes);
    data = data.filter((p) => p.sizes.some((size) => wanted.has(size.label)));
  }
  if (filters.inStock) {
    data = data.filter((p) => p.stock > 0);
  }

  return {
    data,
    meta: {
      page: filters.page,
      limit: filters.limit,
      total,
      hasNext: filters.page * filters.limit < total,
    },
  };
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function getPublicProduct(id: string) {
  // A non-uuid id (e.g. a stray slug) can never match a row — treat it as
  // not-found rather than letting it reach the DB as a malformed uuid param.
  if (!UUID_RE.test(id)) {
    throw notFound("Product");
  }

  const row = await productsRepo.findPublicById(id);
  if (!row) {
    throw notFound("Product");
  }

  const [sizesByProduct, colorsByProduct, stockByKey] = await Promise.all([
    sizesByProductId([id]),
    colorsByProductId([id]),
    inventoryStockByProductIds([id]),
  ]);
  return serialize(
    row,
    sizesByProduct.get(id) ?? [],
    colorsByProduct.get(id) ?? [],
    stockByKey,
  );
}

/** `GET /api/v1/categories/:slug/products` — shares the main list query. */
export async function listPublicProductsInCategory(
  categorySlug: string,
  filters: Omit<ListPublicProductsFilters, "categorySlug">,
) {
  return listPublicProducts({ ...filters, categorySlug });
}
