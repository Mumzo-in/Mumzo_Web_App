import type { ProductStatus } from "@mumzo/schema";

export const PRODUCT_STATUS_META: Record<
  ProductStatus,
  { label: string; tint: string }
> = {
  draft: { label: "Draft", tint: "bg-muted text-muted-foreground" },
  active: { label: "Active", tint: "bg-sage text-ink" },
  inactive: { label: "Inactive", tint: "bg-accent text-ink" },
  archived: { label: "Archived", tint: "bg-secondary text-muted-foreground" },
};
