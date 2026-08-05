import { apiList, apiRequest, type Paginated } from "@/core/api/client";
import type { ListParams } from "@/core/api/query-keys";

export type Vendor = {
  id: string;
  name: string;
  slug: string;
  contactName: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  gstin: string | null;
  isActive: boolean;
  productCount: number;
};

export function listVendors(params: ListParams): Promise<Paginated<Vendor>> {
  return apiList<Vendor>("/vendors", params);
}

export function getVendor(id: string): Promise<Vendor> {
  return apiRequest<Vendor>(`/vendors/${id}`);
}

/** Everything the form owns. `id`/`productCount` are server-owned. */
export type VendorInput = {
  name: string;
  slug: string;
  contactName: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  gstin: string | null;
  isActive: boolean;
};

export function createVendor(input: VendorInput): Promise<Vendor> {
  return apiRequest<{ id: string }>("/vendors", {
    method: "POST",
    body: input,
  }).then(({ id }) => getVendor(id));
}

export function updateVendor(
  id: string,
  input: Partial<VendorInput>,
): Promise<Vendor> {
  return apiRequest<{ ok: true }>(`/vendors/${id}`, {
    method: "PATCH",
    body: input,
  }).then(() => getVendor(id));
}

export function deleteVendor(id: string): Promise<{ ok: true }> {
  return apiRequest<{ ok: true }>(`/vendors/${id}`, { method: "DELETE" });
}
