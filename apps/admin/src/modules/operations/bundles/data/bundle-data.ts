import type { BundleStatus } from "@mumzo/schema";

/** Same draft/active/inactive/archived lifecycle and tints as products —
 * see `PRODUCT_STATUS_META`. Kept as its own copy rather than a shared
 * import so a bundle-specific tint can diverge later without touching the
 * product table. */
export const BUNDLE_STATUS_META: Record<
  BundleStatus,
  { label: string; tint: string }
> = {
  draft: { label: "Draft", tint: "bg-muted text-muted-foreground" },
  active: { label: "Active", tint: "bg-sage text-ink" },
  inactive: { label: "Inactive", tint: "bg-accent text-ink" },
  archived: { label: "Archived", tint: "bg-secondary text-muted-foreground" },
};
