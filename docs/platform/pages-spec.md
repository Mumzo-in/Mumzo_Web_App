# Mumzo — Platform (Customer App) Page Spec

Customer-facing storefront for **Mumzo** (quick-commerce, baby & mom products).
Stack: React + TanStack Router (file-based) + Vite + `@mumzo/ui`.

This spec is the page inventory for `apps/platform`. Every route below currently
renders a shared **`ComingSoon`** placeholder (`src/core/components/coming-soon.tsx`);
real screens replace them feature by feature. API mappings reference
[`docs/api/mumzo_api_plan.md`](../api/mumzo_api_plan.md) — the domain source of truth
(the backend is still being built).

## Conventions

- **Routes** live in `src/pages/` (file-based; compiled to `routeTree.gen.ts`).
- **Shared UI/hooks** live in `src/core/`.
- **Feature domains** live in `src/modules/<domain>/{api,components,index.ts}` and are
  built as features land (only `modules/auth` exists today). The **Module** column
  names the intended owner.
- **Protected routes** sit under the pathless group `src/pages/(protected)/`, guarded by
  `(protected)/_layout.tsx` (`beforeLoad` → `authClient.getSession()`, redirect to
  `/auth/login` if unauthenticated). The `(protected)` segment is stripped from the URL.
- **404**: unmatched routes render `NotFound` (`src/core/components/not-found.tsx`), wired
  as `defaultNotFoundComponent` in `src/main.tsx`.
- **Phase** follows the api-plan roadmap: 1 = MVP, 2/3 = later.

## Shopping (public)

| Route | File | Purpose | Primary API | Module | Phase |
|---|---|---|---|---|---|
| `/` | `pages/index.tsx` | Home — categories, featured, bestsellers | `categories`, `products/featured` | products | 1 |
| `/category/$slug` | `pages/category/$slug.tsx` | Category browse + filters | `categories/:slug/products` | products | 1 |
| `/product` | `pages/product/index.tsx` | Product listing / search results | `products`, `search` | products | 1 |
| `/product/$productId` | `pages/product/$productId/index.tsx` | Product detail | `products/:id`, `/related` | products | 1 |
| `/product/$productId/reviews` | `pages/product/$productId/reviews.tsx` | Product reviews & ratings | `products/:id/reviews` | reviews | 2 |
| `/search` | `pages/search.tsx` | Search + suggestions/trending | `search`, `/suggestions` | search | 2 |

## Cart (public — guest cart supported)

| Route | File | Purpose | Primary API | Module | Phase |
|---|---|---|---|---|---|
| `/cart` | `pages/cart.tsx` | Cart, coupons, totals | `cart`, `cart/coupon`, `cart/totals` | cart | 1 |

## Auth (public)

| Route | File | Purpose | Primary API | Module | Phase |
|---|---|---|---|---|---|
| `/auth/login` | `pages/auth/login.tsx` | Sign in / sign up (real forms) | `auth/sign-in`, `sign-up` | auth | 1 |
| `/auth/forgot-password` | `pages/auth/forgot-password.tsx` | Request reset link | `auth/forget-password` | auth | 1 |
| `/auth/reset-password` | `pages/auth/reset-password.tsx` | Set new password | `auth/reset-password` | auth | 1 |
| `/auth/verify-email` | `pages/auth/verify-email.tsx` | Email verification landing | `auth/verify-email` | auth | 1 |
| `/auth/otp` | `pages/auth/otp.tsx` | Phone OTP verification | `auth/phone` (planned) | auth | 2 |

## Checkout (protected, multi-step)

| Route | File | Purpose | Primary API | Module | Phase |
|---|---|---|---|---|---|
| `/checkout/address` | `pages/(protected)/checkout/address.tsx` | Pick / add delivery address | `addresses` | checkout | 1 |
| `/checkout/payment` | `pages/(protected)/checkout/payment.tsx` | Choose payment method | `payments/initiate` | checkout | 1 |
| `/checkout/review` | `pages/(protected)/checkout/review.tsx` | Review & place order | `orders` (place) | checkout | 1 |
| `/payment/status` | `pages/(protected)/payment/status.tsx` | Razorpay redirect callback | `payments/verify` | checkout | 1 |

## Orders (protected)

| Route | File | Purpose | Primary API | Module | Phase |
|---|---|---|---|---|---|
| `/orders` | `pages/(protected)/orders/index.tsx` | Order history | `orders` (list) | orders | 1 |
| `/orders/$orderId` | `pages/(protected)/orders/$orderId/index.tsx` | Order detail / confirmation | `orders/:id`, `/invoice` | orders | 1 |
| `/orders/$orderId/tracking` | `pages/(protected)/orders/$orderId/tracking.tsx` | Live order tracking | `orders/:id/tracking` | orders | 1 |
| `/orders/$orderId/return` | `pages/(protected)/orders/$orderId/return.tsx` | Return / refund request | `orders/:id/return` | orders | 2 |

## Account (protected)

| Route | File | Purpose | Primary API | Module | Phase |
|---|---|---|---|---|---|
| `/profile` | `pages/(protected)/profile/index.tsx` | Profile & account settings | `users/me` | account | 2 |
| `/profile/baby` | `pages/(protected)/profile/baby.tsx` | Baby profile (age → recommendations) | `users/me/baby` | account | 2 |
| `/addresses` | `pages/(protected)/addresses.tsx` | Saved addresses CRUD | `addresses` | account | 1 |
| `/wishlist` | `pages/(protected)/wishlist.tsx` | Saved items | `wishlist` | wishlist | 2 |
| `/notifications` | `pages/(protected)/notifications.tsx` | Notification center | `notifications` | notifications | 2 |
| `/subscriptions` | `pages/(protected)/subscriptions/index.tsx` | "Subscribe & forget" schedules | `subscriptions` | subscriptions | 3 |

## Static / support (public)

| Route | File | Purpose | Module | Phase |
|---|---|---|---|---|
| `/about` | `pages/about.tsx` | About Mumzo | static | 1 |
| `/contact` | `pages/contact.tsx` | Contact | static | 1 |
| `/help` | `pages/help.tsx` | Help / FAQ / support | static | 2 |
| `/legal/privacy` | `pages/legal/privacy.tsx` | Privacy Policy | static | 1 |
| `/legal/terms` | `pages/legal/terms.tsx` | Terms & Conditions | static | 1 |
| `/legal/returns` | `pages/legal/returns.tsx` | Return & Refund Policy | static | 1 |
| `/legal/shipping` | `pages/legal/shipping.tsx` | Shipping Policy | static | 1 |

## System

| Behavior | File | Notes |
|---|---|---|
| 404 Not Found | `src/core/components/not-found.tsx` | `defaultNotFoundComponent` in `main.tsx` |
| Placeholder | `src/core/components/coming-soon.tsx` | Shared "Coming soon" body for unbuilt pages |
| Root layout | `src/pages/__root.tsx` | Header + theme + toaster shell |
