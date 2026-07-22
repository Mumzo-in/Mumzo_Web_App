import { conflict, notFound } from "@/core/errors";
import * as productsRepo from "./products.repo";

type Size = { label: string; price: number; stock: number };

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
    vendor: row.vendorName,
    vendorId: row.vendorId,
    categorySlug: row.categorySlug,
    price: row.price,
    mrp: row.mrp,
    costPrice: row.costPrice,
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
    status: row.status as "draft" | "active" | "archived",
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
  vendorId: string | null;
  categorySlug: string;
  status: "draft" | "active" | "archived";
  price: number;
  mrp: number;
  costPrice: number | null;
  qty: string;
  weight: string | null;
  description: string;
  about: string;
  highlights: string[];
  countryOfOrigin: string;
  images: string[];
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

async function assertVendorExists(vendorId: string | null) {
  if (vendorId === null) {
    return;
  }
  const exists = await productsRepo.vendorExists(vendorId);
  if (!exists) {
    throw notFound("Vendor");
  }
}

export async function createProduct(input: ProductInput) {
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
  await assertVendorExists(input.vendorId);
  const categoryId = await resolveCategoryId(input.categorySlug);

  const { sizes, categorySlug, ...rest } = input;

  return productsRepo.insert({ ...rest, categoryId }, sizes);
}

async function requireProductId(id: string) {
  const row = await productsRepo.findById(id);
  if (!row) {
    throw notFound("Product");
  }
  return row;
}

export async function updateProduct(id: string, input: ProductInput) {
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
  await assertVendorExists(input.vendorId);
  const categoryId = await resolveCategoryId(input.categorySlug);

  const { sizes, categorySlug, ...rest } = input;

  await productsRepo.update(id, { ...rest, categoryId }, sizes);
}

export async function deleteProduct(id: string) {
  await requireProductId(id);
  await productsRepo.remove(id);
}
