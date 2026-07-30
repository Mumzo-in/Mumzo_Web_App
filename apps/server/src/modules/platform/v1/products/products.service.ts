import { notFound } from "@/core/errors";
import { toPaise, toWholeRupees } from "@/lib/money";
import {
  colorsByProductId,
  sizesByProductId,
} from "@/modules/admin/v1/products/products.repo";
import type { PublicSort } from "./products.repo";
import * as productsRepo from "./products.repo";

type Size = { id: string; label: string; price: number; stock: number };
type Color = { id: string; label: string; price: number; stock: number };

/** Total stock across variants, or 0 for an unsized product — DB is the source. */
function rollUpStock(sizes: Size[]): number {
  return sizes.reduce((sum, size) => sum + size.stock, 0);
}

function toRupeeVariant<T extends { price: number }>(variant: T): T {
  return { ...variant, price: toWholeRupees(variant.price) };
}

type ProductRow = Awaited<ReturnType<typeof productsRepo.findPublicById>>;

function serialize(
  row: NonNullable<ProductRow>,
  sizesInPaise: Size[],
  colorsInPaise: Color[],
) {
  const sizes = sizesInPaise.map(toRupeeVariant);
  const colors = colorsInPaise.map(toRupeeVariant);
  return {
    id: row.id,
    slug: row.slug,
    sku: row.sku,
    name: row.name,
    brand: row.brandName,
    brandSlug: row.brandSlug,
    categorySlug: row.categorySlug,
    price: toWholeRupees(row.price),
    mrp: toWholeRupees(row.mrp),
    qty: row.qty,
    weight: row.weight,
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
    stock: sizes.length > 0 ? rollUpStock(sizes) : 0,
    rating: Number(row.rating),
    isBestseller: row.isBestseller,
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
  });

  const productIds = rows.map((row) => row.id);
  const [sizesByProduct, colorsByProduct] = await Promise.all([
    sizesByProductId(productIds),
    colorsByProductId(productIds),
  ]);

  let data = rows.map((row) =>
    serialize(
      row,
      sizesByProduct.get(row.id) ?? [],
      colorsByProduct.get(row.id) ?? [],
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

  const [sizesByProduct, colorsByProduct] = await Promise.all([
    sizesByProductId([id]),
    colorsByProductId([id]),
  ]);
  return serialize(
    row,
    sizesByProduct.get(id) ?? [],
    colorsByProduct.get(id) ?? [],
  );
}

/** `GET /api/v1/categories/:slug/products` — shares the main list query. */
export async function listPublicProductsInCategory(
  categorySlug: string,
  filters: Omit<ListPublicProductsFilters, "categorySlug">,
) {
  return listPublicProducts({ ...filters, categorySlug });
}
