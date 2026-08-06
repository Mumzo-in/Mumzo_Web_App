import { apiList, apiRequest, type Paginated } from "@/core/api/client";
import type { ListParams } from "@/core/api/query-keys";
import type {
  PaymentTerms,
  VendorContact,
  VendorType,
} from "../data/vendor-data";
import { vendorInvoices } from "../data/vendor-invoice-data";
import { vendorSaleSummaries } from "../data/vendor-sale-data";

export type {
  PaymentTerms,
  VendorContact,
  VendorType,
} from "../data/vendor-data";

export type Vendor = {
  id: string;
  name: string;
  slug: string;
  type: VendorType;
  contacts: VendorContact[];
  address: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  lat: number | null;
  lng: number | null;
  gstin: string | null;
  pan: string | null;
  paymentTerms: PaymentTerms;
  defaultLeadTimeDays: number | null;
  notes: string | null;
  isActive: boolean;
  productCount: number;
};

export function listVendors(params: ListParams): Promise<Paginated<Vendor>> {
  return apiList<Vendor>("/vendors", params);
}

export async function listAllVendors(): Promise<Vendor[]> {
  const { data } = await apiList<Vendor>("/vendors", { limit: 100 });
  return data;
}

export function getVendor(id: string): Promise<Vendor> {
  return apiRequest<Vendor>(`/vendors/${encodeURIComponent(id)}`);
}

export type VendorInput = {
  name: string;
  slug: string;
  type: VendorType;
  contacts: VendorContact[];
  address: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  lat: number | null;
  lng: number | null;
  gstin: string | null;
  pan: string | null;
  paymentTerms: PaymentTerms;
  defaultLeadTimeDays: number | null;
  notes: string | null;
  isActive: boolean;
};

export function createVendor(input: VendorInput): Promise<{ id: string }> {
  return apiRequest<{ id: string }>("/vendors", {
    method: "POST",
    body: input,
  });
}

export function updateVendor(
  id: string,
  input: Partial<VendorInput>,
): Promise<{ ok: true }> {
  return apiRequest<{ ok: true }>(`/vendors/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: input,
  });
}

export function deleteVendor(id: string): Promise<{ ok: true }> {
  return apiRequest<{ ok: true }>(`/vendors/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

export type VendorProductRow = {
  id: string;
  name: string;
  slug: string;
  categorySlug: string;
  price: number;
  stock: number;
  status: string;
  costPrice: number | null;
  leadTimeDays: number | null;
  isPrimary: boolean;
  vendorSku: string | null;
  moq: number | null;
};

/** Products sourced from this vendor — feeds the vendor detail page's Products tab. */
export async function listVendorProducts(
  vendorId: string,
): Promise<VendorProductRow[]> {
  const { data } = await apiList<VendorProductRow>(
    `/vendors/${encodeURIComponent(vendorId)}/products`,
    { limit: 100 },
  );
  return data;
}

export async function listVendorInvoices(vendorId: string) {
  return vendorInvoices.filter((invoice) => invoice.vendorId === vendorId);
}

export async function getVendorSaleSummary(vendorId: string) {
  return (
    vendorSaleSummaries.find((summary) => summary.vendorId === vendorId) ?? {
      vendorId,
      last30DaysUnits: 0,
      last30DaysRevenue: 0,
      totalUnits: 0,
      totalRevenue: 0,
    }
  );
}
