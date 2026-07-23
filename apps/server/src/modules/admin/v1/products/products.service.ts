import { buildKey, KEY_PREFIXES, toPublicUrl } from "@mumzo/storage";
import { conflict, notFound } from "@/core/errors";
import { finalizeSession } from "@/modules/admin/v1/uploads/uploads.service";
import * as productsRepo from "./products.repo";

type Size = { label: string; price: number; stock: number };

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

function serialize(row: NonNullable<ProductRow>, sizes: Size[]) {
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
          costPrice: row.vendorCostPrice,
          leadTimeDays: row.vendorLeadTimeDays,
          notes: row.vendorNotes,
        }
      : null,
    categorySlug: row.categorySlug,
    price: row.price,
    mrp: row.mrp,
    qty: row.qty,
    weight: row.weight,
    description: row.description,
    about: row.about,
    highlights: row.highlights,
    countryOfOrigin: row.countryOfOrigin,
    images: row.images,
    sizes,
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
}) {
  const { rows, total } = await productsRepo.findPage(filters);
  const sizesByProduct = await productsRepo.sizesByProductId(
    rows.map((row) => row.id),
  );

  return {
    data: rows.map((row) => serialize(row, sizesByProduct.get(row.id) ?? [])),
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

  const sizesByProduct = await productsRepo.sizesByProductId([id]);
  return serialize(row, sizesByProduct.get(id) ?? []);
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
  sizes: Size[];
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

/**
 * Moves a draft session's images from `mumzo/tmp/{sessionId}/*` to their
 * final `mumzo/admin/products/{productId}/{slot}.webp` keys (via
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
    targetKeys[slot] = buildKey("admin", "products", productId, slot);
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

export async function createProduct(input: ProductInput, userId: string) {
  const [bySlug, bySku] = await Promise.all([
    productsRepo.findIdBySlug(input.slug),
    productsRepo.findIdBySku(input.sku),
  ]);

  if (bySlug) {
    throw conflict(`The slug "${input.slug}" is already in use.`);
  }
  if (bySku) {
    throw conflict(`The SKU "${input.sku}" is already in use.`);
  }

  await assertBrandExists(input.brandId);
  await assertVendorExists(input.vendor);
  const categoryId = await resolveCategoryId(input.categorySlug);

  const { sizes, categorySlug, vendor, uploadSessionId, images, ...rest } =
    input;

  // Product row doesn't exist yet to key the final image path on — insert
  // first with draft images, then finalize once the id is known.
  const id = await productsRepo.insert(
    { ...rest, categoryId, images },
    sizes,
    vendor,
  );

  if (uploadSessionId) {
    const finalImages = await finalizeImages(
      id,
      images,
      uploadSessionId,
      userId,
    );
    await productsRepo.update(id, { images: finalImages }, sizes, vendor);
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
  input: ProductInput,
  userId: string,
) {
  await requireProductId(id);

  const [bySlug, bySku] = await Promise.all([
    productsRepo.findIdBySlug(input.slug),
    productsRepo.findIdBySku(input.sku),
  ]);

  if (bySlug && bySlug.id !== id) {
    throw conflict(`The slug "${input.slug}" is already in use.`);
  }
  if (bySku && bySku.id !== id) {
    throw conflict(`The SKU "${input.sku}" is already in use.`);
  }

  await assertBrandExists(input.brandId);
  await assertVendorExists(input.vendor);
  const categoryId = await resolveCategoryId(input.categorySlug);

  const { sizes, categorySlug, vendor, uploadSessionId, images, ...rest } =
    input;

  const finalImages = uploadSessionId
    ? await finalizeImages(id, images, uploadSessionId, userId)
    : images;

  await productsRepo.update(
    id,
    { ...rest, categoryId, images: finalImages },
    sizes,
    vendor,
  );
}

export async function deleteProduct(id: string) {
  await requireProductId(id);
  await productsRepo.remove(id);
}
