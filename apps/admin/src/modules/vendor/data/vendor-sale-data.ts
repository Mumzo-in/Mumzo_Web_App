/**
 * Mock fixtures for vendor sales performance — units sold and revenue
 * attributed to products sourced from this vendor. No order-line-to-vendor
 * join exists in the admin API yet; this models what that rollup will
 * eventually return for the Sales tab.
 */

export type VendorSaleSummary = {
  vendorId: string;
  last30DaysUnits: number;
  last30DaysRevenue: number;
  totalUnits: number;
  totalRevenue: number;
};

export const vendorSaleSummaries: VendorSaleSummary[] = [
  {
    vendorId: "vendor_shreesupply",
    last30DaysUnits: 1240,
    last30DaysRevenue: 486300,
    totalUnits: 8420,
    totalRevenue: 3126500,
  },
  {
    vendorId: "vendor_nandi",
    last30DaysUnits: 310,
    last30DaysRevenue: 96200,
    totalUnits: 2110,
    totalRevenue: 612400,
  },
  {
    vendorId: "vendor_krishnaagro",
    last30DaysUnits: 980,
    last30DaysRevenue: 214500,
    totalUnits: 6040,
    totalRevenue: 1320900,
  },
  {
    vendorId: "vendor_babycareimports",
    last30DaysUnits: 0,
    last30DaysRevenue: 0,
    totalUnits: 0,
    totalRevenue: 0,
  },
];
