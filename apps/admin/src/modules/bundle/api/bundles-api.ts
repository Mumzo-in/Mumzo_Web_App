import type { Bundle, BundleStatus } from "@mumzo/schema";
import type { Paginated } from "@/core/api/client";
import { mockDelete, mockDetail, mockId, mockList } from "@/core/api/mock";
import type { ListParams } from "@/core/api/query-keys";
import { products } from "../../product/data/product-data";
import { bundles } from "../data/bundle-data";

/** Bundles API — real endpoints under `/api/v1/admin/bundles`. */

export type { Bundle };

export async function listBundles(
  params: ListParams,
): Promise<Paginated<Bundle & { itemCount: number }>> {
  const result = await mockList({
    rows: bundles,
    params,
    searchFields: ["name", "slug"],
  });
  return {
    ...result,
    data: result.data.map((bundle) => ({
      ...bundle,
      itemCount: bundle.items.length,
    })),
  };
}

export function getBundle(id: string): Promise<Bundle> {
  return mockDetail(bundles.find((bundle) => bundle.id === id));
}

/** Everything the form owns. `id`/`items[].product*`/timestamps are
 * server-owned — the form picks products by id + quantity, the server
 * resolves each item's name/slug/image/price on the way back out. */
export type BundleInput = {
  name: string;
  slug: string;
  description: string | null;
  price: number;
  images: string[];
  status: BundleStatus;
  items: { productId: string; quantity: number }[];
};

/** Resolves each `{ productId, quantity }` pair into a full `BundleItem`,
 * mirroring what the server would do from the product table. */
function resolveItems(items: BundleInput["items"]): Bundle["items"] {
  return items.map((item) => {
    const product = products.find((row) => row.id === item.productId);
    return {
      productId: item.productId,
      productName: product?.name ?? "",
      productSlug: product?.slug ?? "",
      productImage: product?.images[0] ?? null,
      productPrice: product?.price ?? 0,
      quantity: item.quantity,
    };
  });
}

export async function createBundle(input: BundleInput): Promise<Bundle> {
  const id = mockId("bdl");
  const now = new Date().toISOString();
  bundles.push({
    id,
    name: input.name,
    slug: input.slug,
    description: input.description,
    price: input.price,
    images: input.images,
    status: input.status,
    items: resolveItems(input.items),
    createdAt: now,
    updatedAt: now,
  });
  return getBundle(id);
}

export async function updateBundle(
  id: string,
  input: BundleInput,
): Promise<Bundle> {
  const index = bundles.findIndex((bundle) => bundle.id === id);
  await mockDetail(bundles[index]);
  bundles[index] = {
    ...bundles[index],
    name: input.name,
    slug: input.slug,
    description: input.description,
    price: input.price,
    images: input.images,
    status: input.status,
    items: resolveItems(input.items),
    updatedAt: new Date().toISOString(),
  };
  return getBundle(id);
}

export function deleteBundle(id: string): Promise<{ ok: true }> {
  return mockDelete(bundles, id);
}
