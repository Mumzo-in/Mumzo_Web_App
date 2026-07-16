import type { Paginated } from "@/core/api/client";
import { mockDetail, mockList } from "@/core/api/mock";
import type { ListParams } from "@/core/api/query-keys";
import { type AdminCoupon, coupons, findCoupon } from "../data/coupon-data";

/** Coupons API — api-plan §15f. */
export function listCoupons(
  params: ListParams,
): Promise<Paginated<AdminCoupon>> {
  return mockList({ rows: coupons, params, searchFields: ["code"] });
}

export function getCoupon(id: string): Promise<AdminCoupon> {
  return mockDetail(findCoupon(id));
}
