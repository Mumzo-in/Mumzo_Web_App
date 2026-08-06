/** Shared vendor enums/labels — the vendor and its contacts are typed in `api/vendors-api.ts`. */

export type VendorType =
  | "manufacturer"
  | "distributor"
  | "retailer"
  | "company"
  | "other";

export type PaymentTerms =
  | "prepaid"
  | "cod"
  | "net_7"
  | "net_15"
  | "net_30"
  | "net_60";

export type VendorContact = {
  name: string;
  phone: string | null;
  email: string | null;
  isPrimary: boolean;
};

export const VENDOR_TYPE_LABEL: Record<VendorType, string> = {
  manufacturer: "Manufacturer",
  distributor: "Distributor",
  retailer: "Retailer",
  company: "Company",
  other: "Other",
};

export const PAYMENT_TERMS_LABEL: Record<PaymentTerms, string> = {
  prepaid: "Prepaid",
  cod: "Cash on delivery",
  net_7: "Net 7",
  net_15: "Net 15",
  net_30: "Net 30",
  net_60: "Net 60",
};
