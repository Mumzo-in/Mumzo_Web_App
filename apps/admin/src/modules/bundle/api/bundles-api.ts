import type { Bundle, BundleStatus } from "@mumzo/schema";
import { apiList, apiRequest, type Paginated } from "@/core/api/client";
import type { ListParams } from "@/core/api/query-keys";

/** Bundles API — real endpoints under `/api/v1/admin/bundles`. */

export type { Bundle };

export function listBundles(
  params: ListParams,
): Promise<Paginated<Bundle & { itemCount: number }>> {
  return apiList<Bundle & { itemCount: number }>("/bundles", params);
}

export function getBundle(id: string): Promise<Bundle> {
  return apiRequest<Bundle>(`/bundles/${id}`);
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

export function createBundle(input: BundleInput): Promise<Bundle> {
  return apiRequest<{ id: string }>("/bundles", {
    method: "POST",
    body: input,
  }).then(({ id }) => getBundle(id));
}

export function updateBundle(id: string, input: BundleInput): Promise<Bundle> {
  return apiRequest<{ ok: true }>(`/bundles/${id}`, {
    method: "PUT",
    body: input,
  }).then(() => getBundle(id));
}

export function deleteBundle(id: string): Promise<{ ok: true }> {
  return apiRequest<{ ok: true }>(`/bundles/${id}`, { method: "DELETE" });
}
