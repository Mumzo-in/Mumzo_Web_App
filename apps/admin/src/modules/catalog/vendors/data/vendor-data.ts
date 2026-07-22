import type { VendorType } from "../api/vendors-api";

export const VENDOR_TYPE_META: Record<VendorType, { label: string }> = {
  retailer: { label: "Retailer" },
  store: { label: "Store" },
  distributor: { label: "Distributor" },
};

export const VENDOR_TYPE_OPTIONS: { value: VendorType; label: string }[] = (
  Object.entries(VENDOR_TYPE_META) as [VendorType, { label: string }][]
).map(([value, meta]) => ({ value, label: meta.label }));
