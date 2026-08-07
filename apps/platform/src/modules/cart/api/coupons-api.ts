import { apiRequest } from "@/core/api/client";

export interface PublicCoupon {
  code: string;
  description: string | null;
  type: "flat" | "pct";
  value: number;
  cap: number | null;
  minAmt: number;
}

export function listPublicCoupons(): Promise<PublicCoupon[]> {
  return apiRequest<PublicCoupon[]>("/coupons");
}
