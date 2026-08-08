import { buildKey, KEY_PREFIXES, toPublicUrl } from "@mumzo/storage";
import type { Context } from "hono";
import { logActivity } from "@/core";
import { conflict, notFound } from "@/core/errors";
import type { AppEnv } from "@/core/types";
import { toPaise, toWholeRupees } from "@/lib/money";
import { finalizeSession } from "@/modules/admin/v1/uploads/uploads.service";
import * as productsRepo from "./products.repo";

/** Read-side shape — every row loaded from the DB has an id. */
type Size = { id: string; label: string; price: number; stock: number };
type Color = { id: string; label: string; price: number; stock: number };

/** Write-side shape — the form always fully replaces sizes/colors on save,
 * so any `id` it sends (from a row it displayed) is stale by the time the
 * repo re-inserts; the repo never reads it. */
type SizeInput = { id?: string; label: string; price: number; stock: number };
type ColorInput = {
  id?: string;
  label: string;
  price: number;
  stock: number;
};

type VendorRelationship = "own" | "retainer" | "distributor";

type VendorInput = {
  vendorId: string;
  relationship: VendorRelationship;
  costPrice: number | null;
  leadTimeDays: number | null;
  notes: string | null;
} | null;

/** Total stock across variants, or 0 for an unsized product — DB is the source. */
function rollUpStock(sizes: Size[]): number {
  return sizes.reduce((sum, size) => sum + size.stock, 0);
}

type ProductRow = Awaited<ReturnType<typeof productsRepo.findById>>;

function toRupeeVariant<T extends { price: number }>(variant: T): T {
  return { ...variant, price: toWholeRupees(variant.price) };
}

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
    brandId: row.brandId,
    vendor: row.vendorId
      ? {
          vendorId: row.vendorId,
          vendorName: row.vendorName ?? "",
          relationship: row.vendorRelationship as VendorRelationship,
          costPrice:
            row.vendorCostPrice === null
              ? null
              : toWholeRupees(row.vendorCostPrice),
          leadTimeDays: row.vendorLeadTimeDays,
          notes: row.vendorNotes,
        }
      : null,
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
    status: row.status as "draft" | "active" | "inactive" | "archived",
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function listProducts(filters: {
  page: number;
  limit: number;
  search?: string;
  status?: string;
  categorySlug?: string;
  vendorId?: string;
  stock?: string;
}) {
  const { rows, total } = await productsRepo.findPage(filters);
  const productIds = rows.map((row) => row.id);
  const [sizesByProduct, colorsByProduct] = await Promise.all([
    productsRepo.sizesByProductId(productIds),
    productsRepo.colorsByProductId(productIds),
  ]);

  return {
    data: rows.map((row) =>
      serialize(
        row,
        sizesByProduct.get(row.id) ?? [],
        colorsByProduct.get(row.id) ?? [],
      ),
    ),
    meta: {
      page: filters.page,
      limit: filters.limit,
      total,
      hasNext: filters.page * filters.limit < total,
    },
  };
}

export async function getProduct(id: string) {
  const row = await productsRepo.findById(id);
  if (!row) {
    throw notFound("Product");
  }

  const [sizesByProduct, colorsByProduct] = await Promise.all([
    productsRepo.sizesByProductId([id]),
    productsRepo.colorsByProductId([id]),
  ]);
  return serialize(
    row,
    sizesByProduct.get(id) ?? [],
    colorsByProduct.get(id) ?? [],
  );
}

type ProductInput = {
  name: string;
  slug: string;
  sku: string;
  brandId: string;
  vendor: VendorInput;
  categorySlug: string;
  status: "draft" | "active" | "inactive" | "archived";
  price: number;
  mrp: number;
  qty: string;
  weight: string | null;
  description: string;
  about: string;
  highlights: string[];
  countryOfOrigin: string;
  images: string[];
  /** Draft image-upload session to finalize before persisting `images`. */
  uploadSessionId?: string | null;
  sizes: SizeInput[];
  colors: ColorInput[];
  ages: string[];
  type: string;
  tags: string[];
  isBestseller: boolean;
};

async function resolveCategoryId(categorySlug: string) {
  const category = await productsRepo.findCategoryIdBySlug(categorySlug);
  if (!category) {
    throw notFound("Category");
  }
  return category.id;
}

async function assertBrandExists(brandId: string) {
  const exists = await productsRepo.brandExists(brandId);
  if (!exists) {
    throw notFound("Brand");
  }
}

async function assertVendorExists(vendor: VendorInput) {
  if (vendor === null) {
    return;
  }
  const exists = await productsRepo.vendorExists(vendor.vendorId);
  if (!exists) {
    throw notFound("Vendor");
  }
}

/** The admin form submits/edits money in whole rupees; the DB stores paise
 * (see `lib/money.ts`). This is the one place a `ProductInput` crosses that
 * boundary before reaching the repo. */
function toPaiseInput(input: ProductInput): ProductInput {
  return {
    ...input,
    price: toPaise(input.price),
    mrp: toPaise(input.mrp),
    vendor: input.vendor
      ? {
          ...input.vendor,
          costPrice:
            input.vendor.costPrice === null
              ? null
              : toPaise(input.vendor.costPrice),
        }
      : null,
    sizes: input.sizes.map((size) => ({ ...size, price: toPaise(size.price) })),
    colors: input.colors.map((color) => ({
      ...color,
      price: toPaise(color.price),
    })),
  };
}

/**
 * Moves a draft session's images from `mumzo/tmp/{sessionId}/*` to their
 * final `mumzo/platform/products/{productId}/{slot}.webp` keys (via
 * `@mumzo/storage`'s `finalizeSession` — an R2 copy per slot, then the tmp
 * prefix is wiped) and returns the final public URLs to persist on
 * `product.images`. Images not drafted this session (already-final URLs on
 * an edit that didn't touch the gallery) pass through untouched.
 */
async function finalizeImages(
  productId: string,
  images: string[],
  uploadSessionId: string,
  userId: string,
): Promise<string[]> {
  const tmpPrefix = KEY_PREFIXES.tmp + uploadSessionId;
  const slotByIndex = new Map<number, string>();
  const targetKeys: Record<string, string> = {};

  images.forEach((url, index) => {
    if (!url.includes(tmpPrefix)) {
      return;
    }
    const slot =
      url
        .split("/")
        .pop()
        ?.replace(/\.webp$/, "") ?? `${index}`;
    slotByIndex.set(index, slot);
    targetKeys[slot] = buildKey("platform", "products", productId, slot);
  });

  if (Object.keys(targetKeys).length === 0) {
    return images;
  }

  await finalizeSession(uploadSessionId, userId, targetKeys);

  return images.map((url, index) => {
    const slot = slotByIndex.get(index);
    return slot ? toPublicUrl(targetKeys[slot] as string) : url;
  });
}

export async function createProduct(
  rawInput: ProductInput,
  userId: string,
  c?: Context<AppEnv>,
) {
  const [bySlug, bySku] = await Promise.all([
    productsRepo.findIdBySlug(rawInput.slug),
    productsRepo.findIdBySku(rawInput.sku),
  ]);

  if (bySlug) {
    throw conflict(`The slug "${rawInput.slug}" is already in use.`);
  }
  if (bySku) {
    throw conflict(`The SKU "${rawInput.sku}" is already in use.`);
  }

  await assertBrandExists(rawInput.brandId);
  await assertVendorExists(rawInput.vendor);
  const categoryId = await resolveCategoryId(rawInput.categorySlug);

  const input = toPaiseInput(rawInput);
  const {
    sizes,
    colors,
    categorySlug,
    vendor,
    uploadSessionId,
    images,
    ...rest
  } = input;

  // Product row doesn't exist yet to key the final image path on — insert
  // first with draft images, then finalize once the id is known.
  const id = await productsRepo.insert(
    { ...rest, categoryId, images },
    sizes,
    colors,
    vendor,
  );

  if (uploadSessionId) {
    const finalImages = await finalizeImages(
      id,
      images,
      uploadSessionId,
      userId,
    );
    await productsRepo.update(
      id,
      { images: finalImages },
      sizes,
      colors,
      vendor,
    );
  }

  if (c) {
    await logActivity({
      c,
      action: "product.create",
      entityType: "product",
      entityId: id,
      description: `Created product "${rawInput.name}" (SKU: ${rawInput.sku})`,
      newValues: rawInput,
    });
  }

  return id;
}

async function requireProductId(id: string) {
  const row = await productsRepo.findById(id);
  if (!row) {
    throw notFound("Product");
  }
  return row;
}

export async function updateProduct(
  id: string,
  rawInput: ProductInput,
  userId: string,
  c?: Context<AppEnv>,
) {
  const row = await requireProductId(id);

  const [bySlug, bySku] = await Promise.all([
    productsRepo.findIdBySlug(rawInput.slug),
    productsRepo.findIdBySku(rawInput.sku),
  ]);

  if (bySlug && bySlug.id !== id) {
    throw conflict(`The slug "${rawInput.slug}" is already in use.`);
  }
  if (bySku && bySku.id !== id) {
    throw conflict(`The SKU "${rawInput.sku}" is already in use.`);
  }

  await assertBrandExists(rawInput.brandId);
  await assertVendorExists(rawInput.vendor);
  const categoryId = await resolveCategoryId(rawInput.categorySlug);

  const input = toPaiseInput(rawInput);
  const {
    sizes,
    colors,
    categorySlug,
    vendor,
    uploadSessionId,
    images,
    ...rest
  } = input;

  const finalImages = uploadSessionId
    ? await finalizeImages(id, images, uploadSessionId, userId)
    : images;

  await productsRepo.update(
    id,
    { ...rest, categoryId, images: finalImages },
    sizes,
    colors,
    vendor,
  );

  if (c) {
    await logActivity({
      c,
      action: "product.update",
      entityType: "product",
      entityId: id,
      description: `Updated product "${rawInput.name}"`,
      previousValues: row,
      newValues: rawInput,
    });
  }
}

export async function deleteProduct(id: string, c?: Context<AppEnv>) {
  const row = await requireProductId(id);
  await productsRepo.remove(id);

  if (c) {
    await logActivity({
      c,
      action: "product.delete",
      entityType: "product",
      entityId: id,
      description: `Deleted product "${row.name}"`,
      previousValues: row,
    });
  }
}
