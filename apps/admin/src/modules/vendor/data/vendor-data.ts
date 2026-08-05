import type { Vendor } from "../api/vendors-api";

/**
 * Indian supplier-style vendor fixtures. `productCount` is NOT stored here —
 * it's derived at read time in `vendors-api.ts` by counting the product
 * fixtures whose `vendor.vendorId` matches, so it can never drift.
 */
export const vendors: Omit<Vendor, "productCount">[] = [
  {
    id: "vendor_shreesupply",
    name: "Shree Supply Co.",
    slug: "shree-supply-co",
    contactName: "Ramesh Iyer",
    phone: "+91 98765 43210",
    email: "ramesh@shreesupply.in",
    address: "Plot 14, Jeedimetla Industrial Area, Hyderabad, 500055",
    gstin: "36AAACS1234F1Z5",
    isActive: true,
  },
  {
    id: "vendor_nandi",
    name: "Nandi Trading Ltd.",
    slug: "nandi-trading",
    contactName: "Priya Reddy",
    phone: "+91 98123 45678",
    email: "priya@nanditrading.in",
    address: "Balanagar Industrial Estate, Hyderabad, 500037",
    gstin: "36AAACN5678K1Z2",
    isActive: true,
  },
  {
    id: "vendor_krishnaagro",
    name: "Krishna Agro & Foods",
    slug: "krishna-agro-foods",
    contactName: "Suresh Naidu",
    phone: "+91 90000 11223",
    email: "suresh@krishnaagro.in",
    address: "Uppal, Hyderabad, 500039",
    gstin: null,
    isActive: true,
  },
  {
    id: "vendor_westside",
    name: "Westside Distributors",
    slug: "westside-distributors",
    contactName: "Anita Shah",
    phone: "+91 99887 76655",
    email: "anita@westsidedist.in",
    address: "Kukatpally, Hyderabad, 500072",
    gstin: "36AABCW4321L1Z9",
    isActive: false,
  },
  {
    id: "vendor_sunriseimports",
    name: "Sunrise Imports",
    slug: "sunrise-imports",
    contactName: "Vikram Rao",
    phone: "+91 91234 56789",
    email: "vikram@sunriseimports.in",
    address: "Balanagar, Hyderabad, 500037",
    gstin: "36AADCS9988M1Z3",
    isActive: true,
  },
  {
    id: "vendor_littleones",
    name: "Little Ones Wholesale",
    slug: "little-ones-wholesale",
    contactName: null,
    phone: "+91 90123 87654",
    email: null,
    address: "Medchal Road, Hyderabad, 500014",
    gstin: null,
    isActive: true,
  },
];
