/**
 * Mock fixtures for vendor purchase invoices (GRN-linked bills). No
 * procurement admin module exists yet — this models the eventual
 * `purchaseOrder`/`goodsReceivedNote` read surface for the vendor detail
 * page's Invoices tab.
 */

export type InvoiceStatus = "paid" | "pending" | "overdue";

export type VendorInvoice = {
  id: string;
  vendorId: string;
  invoiceNumber: string;
  poNumber: string;
  amount: number;
  status: InvoiceStatus;
  issuedAt: string;
  dueAt: string;
};

export const vendorInvoices: VendorInvoice[] = [
  {
    id: "inv_1001",
    vendorId: "vendor_shreesupply",
    invoiceNumber: "SSC-INV-1001",
    poNumber: "PO-2026-0041",
    amount: 84500,
    status: "paid",
    issuedAt: "2026-06-12T10:00:00.000Z",
    dueAt: "2026-07-12T10:00:00.000Z",
  },
  {
    id: "inv_1002",
    vendorId: "vendor_shreesupply",
    invoiceNumber: "SSC-INV-1014",
    poNumber: "PO-2026-0058",
    amount: 62300,
    status: "pending",
    issuedAt: "2026-07-20T10:00:00.000Z",
    dueAt: "2026-08-19T10:00:00.000Z",
  },
  {
    id: "inv_1003",
    vendorId: "vendor_nandi",
    invoiceNumber: "NTL-INV-0230",
    poNumber: "PO-2026-0033",
    amount: 41200,
    status: "overdue",
    issuedAt: "2026-05-30T10:00:00.000Z",
    dueAt: "2026-06-14T10:00:00.000Z",
  },
  {
    id: "inv_1004",
    vendorId: "vendor_krishnaagro",
    invoiceNumber: "KAF-INV-0099",
    poNumber: "PO-2026-0061",
    amount: 128900,
    status: "paid",
    issuedAt: "2026-07-01T10:00:00.000Z",
    dueAt: "2026-07-31T10:00:00.000Z",
  },
];
