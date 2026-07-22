import { apiList, apiRequest, type Paginated } from "@/core/api/client";
import type { ListParams } from "@/core/api/query-keys";

export type CouponType = "flat" | "pct";
export type ProductScope = "all" | "specific";
export type CouponVisibility = "public" | "assigned";

export type Coupon = {
  id: string;
  code: string;
  description: string | null;

  type: CouponType;
  value: number;
  cap: number | null;
  minAmt: number;

  categorySlug: string | null;
  brandId: string | null;
  productScope: ProductScope;
  productIds: string[];

  visibility: CouponVisibility;
  assignedUserIds: string[];

  segment: string | null;
  firstOrderOnly: boolean;

  maxUses: number | null;
  /** Stored, not yet enforced — needs order history. */
  maxUsesPerUser: number | null;
  usedCount: number;

  isStackable: boolean;
  priority: number;

  expiresAt: string;
  startsAt: string | null;
  isActive: boolean;

  createdAt: string;
  updatedAt: string;
};

export function listCoupons(params: ListParams): Promise<Paginated<Coupon>> {
  return apiList<Coupon>("/coupons", params);
}

export function getCoupon(id: string): Promise<Coupon> {
  return apiRequest<Coupon>(`/coupons/${id}`);
}

/** Everything the form owns. `id`/`usedCount`/`createdAt`/`updatedAt` are server-owned. */
export type CouponInput = {
  code: string;
  description: string | null;
  type: CouponType;
  value: number;
  cap: number | null;
  minAmt: number;
  categorySlug: string | null;
  brandId: string | null;
  productScope: ProductScope;
  productIds: string[];
  visibility: CouponVisibility;
  assignedUserIds: string[];
  segment: string | null;
  firstOrderOnly: boolean;
  maxUses: number | null;
  maxUsesPerUser: number | null;
  isStackable: boolean;
  priority: number;
  expiresAt: string;
  startsAt: string | null;
  isActive: boolean;
};

export function createCoupon(input: CouponInput): Promise<Coupon> {
  return apiRequest<{ id: string }>("/coupons", {
    method: "POST",
    body: input,
  }).then(({ id }) => getCoupon(id));
}

export function updateCoupon(
  id: string,
  input: Partial<CouponInput>,
): Promise<Coupon> {
  return apiRequest<{ ok: true }>(`/coupons/${id}`, {
    method: "PATCH",
    body: input,
  }).then(() => getCoupon(id));
}

/** api-plan §15f: deactivates the coupon, does not delete it. */
export function deactivateCoupon(id: string): Promise<{ ok: true }> {
  return apiRequest<{ ok: true }>(`/coupons/${id}`, { method: "DELETE" });
}
