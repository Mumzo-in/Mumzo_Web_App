import { db } from "@mumzo/db";
import { brand, category, product } from "@mumzo/db/schema/catalog";
import {
  and,
  asc,
  desc,
  eq,
  gte,
  inArray,
  lte,
  type SQL,
  sql,
} from "drizzle-orm";

/**
 * Pure data access for public product reads. Separate from the admin repo
 * (`admin/v1/products/products.repo.ts`) because the public surface filters
 * and sorts differently — `status = "active"` always, brand *slugs* instead
 * of ids, price range, and a `sort` enum the admin list doesn't need yet.
 * `sizesByProductId` is still reused as-is from the admin repo (pure read,
 * no admin-only concerns).
 */

const selection = {
  id: product.id,
  slug: product.slug,
  sku: product.sku,
  name: product.name,
  brandName: brand.name,
  brandSlug: brand.slug,
  categorySlug: category.slug,
  price: product.price,
  mrp: product.mrp,
  qty: product.qty,
  weight: product.weight,
  description: product.description,
  about: product.about,
  highlights: product.highlights,
  countryOfOrigin: product.countryOfOrigin,
  images: product.images,
  ages: product.ages,
  type: product.type,
  tags: product.tags,
  isBestseller: product.isBestseller,
  rating: product.rating,
  updatedAt: product.updatedAt,
};

function baseQuery() {
  return db
    .select(selection)
    .from(product)
    .innerJoin(brand, eq(brand.id, product.brandId))
    .innerJoin(category, eq(category.id, product.categoryId));
}

export type PublicSort =
  | "relevance"
  | "price_asc"
  | "price_desc"
  | "discount"
  | "rating";

/**
 * Fuzzy-search relevance score for a `pg_trgm`-backed match — the greater of
 * plain trigram similarity (good for whole-word/short-string typos, e.g.
 * "cerela" → "Cereal") and `word_similarity` (good for a short search term
 * matching one word inside a longer, multi-word product/brand name, e.g.
 * "shampu" → "No-Tear Baby Shampoo"), taken across both `product.name` and
 * `brand.name` since search already matches on both.
 *
 * Tuned by hand against the seeded catalog (see products.repo test notes in
 * the PR/report) — 0.35 was forgiving enough to catch real typos
 * ("diprs"→diapers borderline-excluded, "wat wips"→"Water Wipes",
 * "shampu"→"Shampoo", "nutribby"→"NutriBaby") without matching unrelated
 * products for a nonsense query.
 */
const SIMILARITY_THRESHOLD = 0.35;

function relevanceScore(term: string) {
  return sql<number>`greatest(
    similarity(${product.name}, ${term}),
    word_similarity(${term}, ${product.name}),
    similarity(${brand.name}, ${term}),
    word_similarity(${term}, ${brand.name})
  )`;
}

function orderFor(sort: PublicSort, search?: string) {
  switch (sort) {
    case "price_asc":
      return asc(product.price);
    case "price_desc":
      return desc(product.price);
    case "rating":
      return desc(product.rating);
    case "discount":
      // MRP-price gap as a percentage of MRP, computed in SQL — guards
      // against dividing by an MRP of 0.
      return desc(
        sql`case when ${product.mrp} > 0 then (${product.mrp} - ${product.price})::float / ${product.mrp} else 0 end`,
      );
    default:
      // "relevance": rank by fuzzy-match score when there's a search term,
      // otherwise fall back to newest-first (previous default behaviour).
      return search ? desc(relevanceScore(search)) : desc(product.updatedAt);
  }
}

export async function findPublicPage(filters: {
  page: number;
  limit: number;
  search?: string;
  categorySlug?: string;
  brandSlugs?: string[];
  minPrice?: number;
  maxPrice?: number;
  sort: PublicSort;
}) {
  const conditions: SQL[] = [eq(product.status, "active")];

  if (filters.search) {
    // `pg_trgm`-powered fuzzy match — see `relevanceScore` doc comment.
    // GIN trigram indexes on `product.name`/`brand.name`
    // (migration 0006) back this comparison.
    conditions.push(
      sql`${relevanceScore(filters.search)} > ${SIMILARITY_THRESHOLD}`,
    );
  }
  if (filters.categorySlug) {
    conditions.push(eq(category.slug, filters.categorySlug));
  }
  if (filters.brandSlugs && filters.brandSlugs.length > 0) {
    conditions.push(inArray(brand.slug, filters.brandSlugs));
  }
  if (filters.minPrice !== undefined) {
    conditions.push(gte(product.price, filters.minPrice));
  }
  if (filters.maxPrice !== undefined) {
    conditions.push(lte(product.price, filters.maxPrice));
  }

  const where = and(...conditions);

  const [rows, countRows] = await Promise.all([
    baseQuery()
      .where(where)
      .orderBy(orderFor(filters.sort, filters.search))
      .limit(filters.limit)
      .offset((filters.page - 1) * filters.limit),
    db
      .select({ total: sql<number>`count(*)` })
      .from(product)
      .innerJoin(brand, eq(brand.id, product.brandId))
      .innerJoin(category, eq(category.id, product.categoryId))
      .where(where),
  ]);

  return { rows, total: Number(countRows[0]?.total ?? 0) };
}

export async function findPublicById(id: string) {
  const [row] = await baseQuery()
    .where(and(eq(product.id, id), eq(product.status, "active")))
    .limit(1);
  return row;
}
