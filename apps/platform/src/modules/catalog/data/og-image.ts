import { BASE_URL } from "@/core/api/client";

/** Server-rendered share card for a product's meta tags — see
 * `apps/server/.../platform/v1/og/og.module.ts`. */
export const productOgImage = (productId: string): string =>
  `${BASE_URL}/og/product/${productId}`;

/** Server-rendered share card for a category's meta tags. */
export const categoryOgImage = (categorySlug: string): string =>
  `${BASE_URL}/og/category/${categorySlug}`;

/** Site-wide fallback — used when no specific product/category applies. */
export const defaultOgImage = (): string => `${BASE_URL}/og/default`;
