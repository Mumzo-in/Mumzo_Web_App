import { notFound } from "@/core/errors";
import * as categoriesRepo from "@/modules/admin/v1/categories/categories.repo";

/**
 * Public reads reuse the admin repo's data access (already returns brand
 * *names* via a join, and `productCount`) rather than duplicating queries.
 * The only public-specific rule is filtering to `isActive` categories —
 * shoppers should never see a category the merchandising team paused.
 */

function toPublicShape(category: {
  slug: string;
  name: string;
  tagline: string | null;
  img: string | null;
  color: string | null;
  hasSizes: boolean;
  brands: string[];
}) {
  return {
    slug: category.slug,
    name: category.name,
    tagline: category.tagline,
    img: category.img,
    color: category.color,
    hasSizes: category.hasSizes,
    brands: category.brands,
  };
}

export async function listPublicCategories() {
  const rows = await categoriesRepo.findAll();
  // `findAll` already orders by `position` ascending.
  return rows.filter((row) => row.isActive).map(toPublicShape);
}

export async function getPublicCategory(slug: string) {
  const category = await categoriesRepo.findBySlug(slug);
  if (!category?.isActive) {
    throw notFound("Category");
  }
  return toPublicShape(category);
}
