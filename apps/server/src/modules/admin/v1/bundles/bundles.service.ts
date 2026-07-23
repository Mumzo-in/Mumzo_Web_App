import { badRequest, conflict, notFound } from "@/core/errors";
import * as bundlesRepo from "./bundles.repo";

type BundleRow = Awaited<ReturnType<typeof bundlesRepo.findById>>;
type ItemRow = {
  productId: string;
  productName: string;
  productSlug: string;
  productImage: string | null;
  productPrice: number;
  quantity: number;
};

function serialize(
  row: NonNullable<BundleRow>,
  items: ItemRow[],
  itemCount?: number,
) {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    price: row.price,
    images: row.images,
    status: row.status as "draft" | "active" | "inactive" | "archived",
    items,
    itemCount: itemCount ?? items.length,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function listBundles(filters: {
  page: number;
  limit: number;
  search?: string;
  status?: string;
  productId?: string;
}) {
  const { rows, total } = await bundlesRepo.findPage(filters);
  const bundleIds = rows.map((row) => row.id);
  const [itemsByBundle, countByBundle] = await Promise.all([
    bundlesRepo.itemsByBundleId(bundleIds),
    bundlesRepo.itemCountByBundleId(bundleIds),
  ]);

  return {
    data: rows.map((row) =>
      serialize(
        row,
        itemsByBundle.get(row.id) ?? [],
        countByBundle.get(row.id) ?? 0,
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

export async function getBundle(id: string) {
  const row = await requireBundle(id);
  const itemsByBundle = await bundlesRepo.itemsByBundleId([id]);
  return serialize(row, itemsByBundle.get(id) ?? []);
}

async function requireBundle(id: string) {
  const row = await bundlesRepo.findById(id);
  if (!row) {
    throw notFound("Bundle");
  }
  return row;
}

type BundleInput = {
  name: string;
  slug: string;
  description: string | null;
  price: number;
  images: string[];
  status: "draft" | "active" | "inactive" | "archived";
  items: { productId: string; quantity: number }[];
};

async function assertItemsValid(items: BundleInput["items"]) {
  if (items.length < 2) {
    throw badRequest("A bundle needs at least 2 products.");
  }

  const ids = items.map((item) => item.productId);
  if (new Set(ids).size !== ids.length) {
    throw badRequest("Each product can only appear once in a bundle.");
  }

  const found = await bundlesRepo.productsExist(ids);
  const missing = ids.filter((id) => !found.includes(id));
  if (missing.length > 0) {
    throw notFound("Product");
  }
}

export async function createBundle(input: BundleInput) {
  const bySlug = await bundlesRepo.findIdBySlug(input.slug);
  if (bySlug) {
    throw conflict(`The slug "${input.slug}" is already in use.`);
  }

  await assertItemsValid(input.items);

  const { items, ...rest } = input;

  return bundlesRepo.insert(rest, items);
}

export async function updateBundle(id: string, input: BundleInput) {
  await requireBundle(id);

  const bySlug = await bundlesRepo.findIdBySlug(input.slug);
  if (bySlug && bySlug.id !== id) {
    throw conflict(`The slug "${input.slug}" is already in use.`);
  }

  await assertItemsValid(input.items);

  const { items, ...rest } = input;

  await bundlesRepo.update(id, rest, items);
}

export async function deleteBundle(id: string) {
  await requireBundle(id);
  await bundlesRepo.remove(id);
}
