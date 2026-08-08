import { db } from "@mumzo/db";
import {
  brand,
  category,
  product,
  productColor,
  productSize,
  productVendor,
  vendor,
} from "@mumzo/db/schema/catalog";
import { and, count, eq, ilike, inArray, or, type SQL, sql } from "drizzle-orm";

/** Pure data access — no business rules. `service.ts` owns those. */

const selection = {
  id: product.id,
  slug: product.slug,
  name: product.name,
  brandId: product.brandId,
  brandName: brand.name,
  vendorId: productVendor.vendorId,
  vendorName: vendor.name,
  vendorRelationship: productVendor.relationship,
  vendorCostPrice: productVendor.costPrice,
  vendorLeadTimeDays: productVendor.leadTimeDays,
  vendorNotes: productVendor.notes,
  categoryId: product.categoryId,
  categorySlug: category.slug,
  price: product.price,
  mrp: product.mrp,
  unitType: product.unitType,
  qty: product.qty,
  description: product.description,
  about: product.about,
  highlights: product.highlights,
  countryOfOrigin: product.countryOfOrigin,
  images: product.images,
  ages: product.ages,
  type: product.type,
  tags: product.tags,
  isBestseller: product.isBestseller,
  status: product.status,
  rating: product.rating,
  createdAt: product.createdAt,
  updatedAt: product.updatedAt,
};

function baseQuery() {
  return db
    .select(selection)
    .from(product)
    .innerJoin(brand, eq(brand.id, product.brandId))
    .innerJoin(category, eq(category.id, product.categoryId))
    .leftJoin(productVendor, eq(productVendor.productId, product.id))
    .leftJoin(vendor, eq(vendor.id, productVendor.vendorId));
}

export async function findPage(filters: {
  page: number;
  limit: number;
  search?: string;
  status?: string;
  categorySlug?: string;
  vendorId?: string;
  stock?: string;
}) {
  const conditions: SQL[] = [];

  if (filters.search) {
    const clause = or(
      ilike(product.name, `%${filters.search}%`),
      ilike(brand.name, `%${filters.search}%`),
    );
    if (clause) {
      conditions.push(clause);
    }
  }
  if (filters.status) {
    conditions.push(eq(product.status, filters.status));
  }
  if (filters.categorySlug) {
    conditions.push(eq(category.slug, filters.categorySlug));
  }
  if (filters.vendorId) {
    conditions.push(eq(productVendor.vendorId, filters.vendorId));
  }
  if (filters.stock === "low") {
    conditions.push(
      sql`exists (select 1 from inventory where inventory.product_id = ${product.id} and inventory.stock <= inventory.reorder_point)`,
    );
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [rows, countRows] = await Promise.all([
    baseQuery()
      .where(where)
      .orderBy(product.updatedAt)
      .limit(filters.limit)
      .offset((filters.page - 1) * filters.limit),
    db
      .select({ total: count(product.id) })
      .from(product)
      .innerJoin(brand, eq(brand.id, product.brandId))
      .innerJoin(category, eq(category.id, product.categoryId))
      .leftJoin(productVendor, eq(productVendor.productId, product.id))
      .where(where),
  ]);

  return { rows, total: countRows[0]?.total ?? 0 };
}

export async function findById(id: string) {
  const [row] = await baseQuery().where(eq(product.id, id)).limit(1);
  return row;
}

type VariantRow = {
  id: string;
  label: string;
  sku: string;
  price: number;
  mrp: number;
  costPrice: number | null;
  stock: number;
  weightGrams: number;
  qty: string;
};

export async function sizesByProductId(productIds: string[]) {
  if (productIds.length === 0) {
    return new Map<string, VariantRow[]>();
  }

  const rows = await db
    .select({
      id: productSize.id,
      productId: productSize.productId,
      label: productSize.label,
      sku: productSize.sku,
      price: productSize.price,
      mrp: productSize.mrp,
      costPrice: productSize.costPrice,
      stock: productSize.stock,
      weightGrams: productSize.weightGrams,
      qty: productSize.qty,
    })
    .from(productSize)
    .where(inArray(productSize.productId, productIds))
    .orderBy(productSize.position);

  const byProduct = new Map<string, VariantRow[]>();

  for (const row of rows) {
    const list = byProduct.get(row.productId) ?? [];
    list.push({
      id: row.id,
      label: row.label,
      sku: row.sku,
      price: row.price,
      mrp: row.mrp,
      costPrice: row.costPrice,
      stock: row.stock,
      weightGrams: row.weightGrams,
      qty: row.qty,
    });
    byProduct.set(row.productId, list);
  }

  return byProduct;
}

export async function colorsByProductId(productIds: string[]) {
  if (productIds.length === 0) {
    return new Map<string, VariantRow[]>();
  }

  const rows = await db
    .select({
      id: productColor.id,
      productId: productColor.productId,
      label: productColor.label,
      sku: productColor.sku,
      price: productColor.price,
      mrp: productColor.mrp,
      costPrice: productColor.costPrice,
      stock: productColor.stock,
      weightGrams: productColor.weightGrams,
      qty: productColor.qty,
    })
    .from(productColor)
    .where(inArray(productColor.productId, productIds))
    .orderBy(productColor.position);

  const byProduct = new Map<string, VariantRow[]>();

  for (const row of rows) {
    const list = byProduct.get(row.productId) ?? [];
    list.push({
      id: row.id,
      label: row.label,
      sku: row.sku,
      price: row.price,
      mrp: row.mrp,
      costPrice: row.costPrice,
      stock: row.stock,
      weightGrams: row.weightGrams,
      qty: row.qty,
    });
    byProduct.set(row.productId, list);
  }

  return byProduct;
}

export async function findIdBySlug(slug: string) {
  const [row] = await db
    .select({ id: product.id })
    .from(product)
    .where(eq(product.slug, slug))
    .limit(1);
  return row;
}

export async function findCategoryIdBySlug(slug: string) {
  const [row] = await db
    .select({ id: category.id })
    .from(category)
    .where(eq(category.slug, slug))
    .limit(1);
  return row;
}

export async function brandExists(brandId: string) {
  const [row] = await db
    .select({ id: brand.id })
    .from(brand)
    .where(eq(brand.id, brandId))
    .limit(1);
  return Boolean(row);
}

export async function vendorExists(vendorId: string) {
  const [row] = await db
    .select({ id: vendor.id })
    .from(vendor)
    .where(eq(vendor.id, vendorId))
    .limit(1);
  return Boolean(row);
}

type ProductRow = typeof product.$inferInsert;

export type VendorLinkInput = {
  vendorId: string;
  relationship: string;
  costPrice: number | null;
  leadTimeDays: number | null;
  notes: string | null;
} | null;

/** Upsert or delete the 1:1 `product_vendor` link — `null` removes it
 * (product becomes self-stocked). Called inside the same transaction as the
 * product write so the two never disagree. */
async function syncVendorLink(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  productId: string,
  vendorLink: VendorLinkInput,
) {
  if (vendorLink === null) {
    await tx
      .delete(productVendor)
      .where(eq(productVendor.productId, productId));
    return;
  }

  await tx
    .insert(productVendor)
    .values({ productId, ...vendorLink })
    .onConflictDoUpdate({
      target: productVendor.productId,
      set: {
        vendorId: vendorLink.vendorId,
        relationship: vendorLink.relationship,
        costPrice: vendorLink.costPrice,
        leadTimeDays: vendorLink.leadTimeDays,
        notes: vendorLink.notes,
        updatedAt: /* @__PURE__ */ new Date(),
      },
    });
}

type VariantInput = {
  id?: string;
  label: string;
  sku: string;
  price: number;
  mrp: number;
  costPrice: number | null;
  stock: number;
  weightGrams: number;
  qty: string;
};

export async function insert(
  values: Omit<ProductRow, "id" | "createdAt" | "updatedAt">,
  sizes: VariantInput[],
  colors: VariantInput[],
  vendorLink: VendorLinkInput,
) {
  return db.transaction(async (tx) => {
    const [row] = await tx
      .insert(product)
      .values(values)
      .returning({ id: product.id });

    if (!row) {
      throw new Error("Insert into product returned no row.");
    }

    if (sizes.length > 0) {
      await tx.insert(productSize).values(
        sizes.map((size, index) => ({
          productId: row.id,
          label: size.label,
          sku: size.sku,
          price: size.price,
          mrp: size.mrp,
          costPrice: size.costPrice,
          stock: size.stock,
          weightGrams: size.weightGrams,
          qty: size.qty,
          position: index,
        })),
      );
    }

    if (colors.length > 0) {
      await tx.insert(productColor).values(
        colors.map((color, index) => ({
          productId: row.id,
          label: color.label,
          sku: color.sku,
          price: color.price,
          mrp: color.mrp,
          costPrice: color.costPrice,
          stock: color.stock,
          weightGrams: color.weightGrams,
          qty: color.qty,
          position: index,
        })),
      );
    }

    await syncVendorLink(tx, row.id, vendorLink);

    return row.id;
  });
}

export async function update(
  id: string,
  values: Partial<Omit<ProductRow, "id" | "createdAt" | "updatedAt">>,
  sizes: VariantInput[],
  colors: VariantInput[],
  vendorLink: VendorLinkInput,
) {
  await db.transaction(async (tx) => {
    if (Object.keys(values).length > 0) {
      await tx.update(product).set(values).where(eq(product.id, id));
    }

    // Sync sizes incrementally to preserve database references (e.g. inventory rows)
    const existingSizes = await tx
      .select({ id: productSize.id })
      .from(productSize)
      .where(eq(productSize.productId, id));

    const existingSizeIds = new Set(existingSizes.map((s) => s.id));
    const inputSizeIds = new Set(
      sizes.map((s) => s.id).filter(Boolean) as string[],
    );

    const sizesToDelete = existingSizes.filter((s) => !inputSizeIds.has(s.id));
    if (sizesToDelete.length > 0) {
      await tx.delete(productSize).where(
        and(
          eq(productSize.productId, id),
          inArray(
            productSize.id,
            sizesToDelete.map((s) => s.id),
          ),
        ),
      );
    }

    for (const [index, size] of sizes.entries()) {
      if (size.id && existingSizeIds.has(size.id)) {
        await tx
          .update(productSize)
          .set({
            label: size.label,
            sku: size.sku,
            price: size.price,
            mrp: size.mrp,
            costPrice: size.costPrice,
            stock: size.stock,
            weightGrams: size.weightGrams,
            qty: size.qty,
            position: index,
          })
          .where(eq(productSize.id, size.id));
      } else {
        await tx.insert(productSize).values({
          productId: id,
          label: size.label,
          sku: size.sku,
          price: size.price,
          mrp: size.mrp,
          costPrice: size.costPrice,
          stock: size.stock,
          weightGrams: size.weightGrams,
          qty: size.qty,
          position: index,
        });
      }
    }

    // Sync colors incrementally to preserve database references
    const existingColors = await tx
      .select({ id: productColor.id })
      .from(productColor)
      .where(eq(productColor.productId, id));

    const existingColorIds = new Set(existingColors.map((c) => c.id));
    const inputColorIds = new Set(
      colors.map((c) => c.id).filter(Boolean) as string[],
    );

    const colorsToDelete = existingColors.filter(
      (c) => !inputColorIds.has(c.id),
    );
    if (colorsToDelete.length > 0) {
      await tx.delete(productColor).where(
        and(
          eq(productColor.productId, id),
          inArray(
            productColor.id,
            colorsToDelete.map((c) => c.id),
          ),
        ),
      );
    }

    for (const [index, color] of colors.entries()) {
      if (color.id && existingColorIds.has(color.id)) {
        await tx
          .update(productColor)
          .set({
            label: color.label,
            sku: color.sku,
            price: color.price,
            mrp: color.mrp,
            costPrice: color.costPrice,
            stock: color.stock,
            weightGrams: color.weightGrams,
            qty: color.qty,
            position: index,
          })
          .where(eq(productColor.id, color.id));
      } else {
        await tx.insert(productColor).values({
          productId: id,
          label: color.label,
          sku: color.sku,
          price: color.price,
          mrp: color.mrp,
          costPrice: color.costPrice,
          stock: color.stock,
          weightGrams: color.weightGrams,
          qty: color.qty,
          position: index,
        });
      }
    }

    await syncVendorLink(tx, id, vendorLink);
  });
}

export async function remove(id: string) {
  await db.delete(product).where(eq(product.id, id));
}
