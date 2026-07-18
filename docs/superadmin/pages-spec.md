# Mumzo — SuperAdmin (Control Panel) Page Spec

Internal ops & control panel for **Mumzo** (quick-commerce, baby & mom products).
Stack: React + TanStack Router (file-based) + TanStack Query + Vite + `@mumzo/ui`.

This spec is the page inventory for `apps/admin`. It translates the 20 feature modules in
[`features.md`](./features.md) into a route inventory. API mappings reference
[`docs/api/mumzo_api_plan.md`](../api/mumzo_api_plan.md) §15 — **the admin API is not built
yet**, so every route currently runs on mock data in `modules/<domain>/data/*.ts` behind a
TanStack Query layer, and the swap to real endpoints is a one-file change per module.

## Conventions

- **Routes** live in `src/pages/` (file-based; compiled to `routeTree.gen.ts`).
- **Shared UI/hooks/data-layer** live in `src/core/`. `core/` must **not** import `modules/`.
- **Feature domains** live in `src/modules/<domain>/{api,components,data,index.ts}`. The
  **Module** column names the owner. Cross-module imports go through the barrel
  (`@/modules/<domain>`); within a module use relative paths.
- **Every admin route** sits under the pathless group `src/pages/(admin)/`, guarded by
  `(admin)/_layout.tsx` (`beforeLoad` → session check → **role check**). The `(admin)`
  segment is stripped from the URL. Auth routes sit outside the group.
- **No public sign-up.** Staff are created via `POST /api/v1/admin/staff` (§15k).
- **404**: unmatched routes render `NotFound` (`src/core/components/not-found.tsx`), wired
  as `defaultNotFoundComponent` in `src/main.tsx`.
- **Phase** follows [`features.md`](./features.md): 1 = MVP, 2/3 = later. Routes marked
  Phase 2/3 render the shared **`ComingSoon`** placeholder until their API exists.

## Auth (public — outside the role gate)

| Route | File | Purpose | Primary API | Module | Phase |
|---|---|---|---|---|---|
| `/login` | `pages/login.tsx` | Staff sign in (no sign-up) | `auth/sign-in` | auth | 1 |
| `/forbidden` | `pages/forbidden.tsx` | Signed in, role not permitted | — | auth | 1 |

## Dashboard

| Route | File | Purpose | Primary API | Module | Phase |
|---|---|---|---|---|---|
| `/` | `pages/(admin)/index.tsx` | Ops overview — GMV, orders, AOV, new users | `admin/dashboard` | dashboard | 1 |
| `/overview/analytics` | `pages/(admin)/overview/analytics.tsx` | Revenue / orders / products / users | `admin/analytics/*` | dashboard | 2 |
| `/overview/ops` | `pages/(admin)/overview/ops.tsx` | Real-time board — live orders + SLA countdowns | `admin/dashboard` | dashboard | 2 |

## Catalog — Products

| Route | File | Purpose | Primary API | Module | Phase |
|---|---|---|---|---|---|
| `/catalog/products` | `pages/(admin)/catalog/products/index.tsx` | Product list + filters | `admin/products` | catalog-products | 1 |
| `/catalog/products/new` | `pages/(admin)/catalog/products/new.tsx` | Create product | `admin/products` (POST) | catalog-products | 1 |
| `/catalog/products/$productId` | `pages/(admin)/catalog/products/$productId/index.tsx` | Edit — pricing, content, variants | `admin/products/:id` | catalog-products | 1 |
| `/catalog/products/$productId/images` | `pages/(admin)/catalog/products/$productId/images.tsx` | Image upload / reorder | `admin/products/:id/images` | catalog-products | 1 |
| `/catalog/products/$productId/stock` | `pages/(admin)/catalog/products/$productId/stock.tsx` | Stock update | `admin/products/:id/stock` | catalog-products | 1 |
| `/catalog/products/bulk` | `pages/(admin)/catalog/products/bulk.tsx` | Bulk CSV import / export | `admin/products/bulk` | catalog-products | 2 |

## Catalog — Categories & Taxonomy

| Route | File | Purpose | Primary API | Module | Phase |
|---|---|---|---|---|---|
| `/catalog/categories` | `pages/(admin)/catalog/categories/index.tsx` | Category list + reorder | `admin/categories`, `/reorder` | catalog-categories | 1 |
| `/catalog/categories/new` | `pages/(admin)/catalog/categories/new.tsx` | Create category | `admin/categories` (POST) | catalog-categories | 1 |
| `/catalog/categories/$slug` | `pages/(admin)/catalog/categories/$slug.tsx` | Edit category (keyed by **slug**) | `admin/categories/:slug` | catalog-categories | 1 |
| `/catalog/brands` | `pages/(admin)/catalog/brands.tsx` | Brand management | — (needs spec) | catalog-categories | 2 |
| `/catalog/collections` | `pages/(admin)/catalog/collections.tsx` | Collections & merchandising | — (needs spec) | catalog-categories | 2 |

## Inventory & Dark-store / Hubs

> **No API spec exists** for this module (api-plan §15 has no hub endpoints). Needs a spec pass.

| Route | File | Purpose | Primary API | Module | Phase |
|---|---|---|---|---|---|
| `/catalog/inventory` | `pages/(admin)/catalog/inventory/index.tsx` | Multi-hub stock view | — (needs spec) | inventory | 2 |
| `/catalog/inventory/adjustments` | `pages/(admin)/catalog/inventory/adjustments.tsx` | Stock adjustments + reasons | — (needs spec) | inventory | 1 |
| `/catalog/inventory/batches` | `pages/(admin)/catalog/inventory/batches.tsx` | Batch & expiry (FEFO) | — (needs spec) | inventory | 2 |
| `/catalog/hubs` | `pages/(admin)/catalog/hubs.tsx` | Dark-store hubs + pincode serviceability | — (needs spec) | inventory | 2 |

## Orders

| Route | File | Purpose | Primary API | Module | Phase |
|---|---|---|---|---|---|
| `/operations/orders` | `pages/(admin)/operations/orders/index.tsx` | All orders + filters | `admin/orders` | orders | 1 |
| `/operations/orders/$orderId` | `pages/(admin)/operations/orders/$orderId.tsx` | Detail, timeline, status, refund | `admin/orders/:id`, `/status`, `/refund` | orders | 1 |
| `/operations/returns` | `pages/(admin)/operations/returns.tsx` | Returns / RMA queue | — (needs spec) | orders | 2 |

## Delivery, Fleet & Dispatch

> **No API spec exists** for this module. Note `POST /admin/orders/:id/assign-delivery`
> models 3PL only — the own-fleet hub/rider path (features.md §6) needs a redesign.

| Route | File | Purpose | Primary API | Module | Phase |
|---|---|---|---|---|---|
| `/operations/dispatch` | `pages/(admin)/operations/dispatch.tsx` | Live dispatch board | — (needs spec) | fleet | 2 |
| `/operations/riders` | `pages/(admin)/operations/riders/index.tsx` | Rider list + onboarding / KYC | — (needs spec) | fleet | 2 |
| `/operations/riders/$riderId` | `pages/(admin)/operations/riders/$riderId.tsx` | Rider detail, shifts, payouts | — (needs spec) | fleet | 3 |

## Customers / Users

| Route | File | Purpose | Primary API | Module | Phase |
|---|---|---|---|---|---|
| `/customers/users` | `pages/(admin)/customers/users/index.tsx` | User list + search | `admin/users` | users | 1 |
| `/customers/users/$userId` | `pages/(admin)/customers/users/$userId.tsx` | Detail, baby profile, order history, ban | `admin/users/:id`, `/ban` | users | 1 |
| `/customers/segments` | `pages/(admin)/customers/segments.tsx` | User segments | — (needs spec) | users | 3 |

## Payments, Refunds & Finance

| Route | File | Purpose | Primary API | Module | Phase |
|---|---|---|---|---|---|
| `/finance/payments` | `pages/(admin)/finance/payments/index.tsx` | Payments list | `admin/payments` | finance | 1 |
| `/finance/payments/$paymentId` | `pages/(admin)/finance/payments/$paymentId.tsx` | Detail + process refund | `admin/payments/:id`, `/refund` | finance | 1 |
| `/finance/payments/failed` | `pages/(admin)/finance/payments/failed.tsx` | Failed / pending payments | `admin/payments/failed` | finance | 1 |
| `/finance/reconciliation` | `pages/(admin)/finance/reconciliation.tsx` | Gateway-vs-orders + COD | — (needs spec) | finance | 2 |
| `/finance/tax` | `pages/(admin)/finance/tax.tsx` | GST config & invoicing | — (needs spec) | finance | 2 |

## Coupons, Offers & Promotions

| Route | File | Purpose | Primary API | Module | Phase |
|---|---|---|---|---|---|
| `/finance/coupons` | `pages/(admin)/finance/coupons/index.tsx` | Coupon list | `admin/coupons` | marketing | 1 |
| `/finance/coupons/new` | `pages/(admin)/finance/coupons/new.tsx` | Create coupon | `admin/coupons` (POST) | marketing | 1 |
| `/finance/coupons/$couponId` | `pages/(admin)/finance/coupons/$couponId.tsx` | Edit + usage stats | `admin/coupons/:id`, `/usage` | marketing | 1 |
| `/finance/campaigns` | `pages/(admin)/finance/campaigns.tsx` | Banner / campaign management | — (needs spec) | marketing | 2 |

## Subscriptions

| Route | File | Purpose | Primary API | Module | Phase |
|---|---|---|---|---|---|
| `/finance/subscriptions` | `pages/(admin)/finance/subscriptions/index.tsx` | All subscriptions | `admin/subscriptions` | subscriptions | 3 |
| `/finance/subscriptions/upcoming` | `pages/(admin)/finance/subscriptions/upcoming.tsx` | Next 7 days | `admin/subscriptions/upcoming` | subscriptions | 3 |

## Reviews & UGC Moderation

| Route | File | Purpose | Primary API | Module | Phase |
|---|---|---|---|---|---|
| `/customers/reviews` | `pages/(admin)/customers/reviews.tsx` | Moderation queue — approve / reject | `admin/reviews`, `/approve`, `/reject` | reviews | 2 |

## CMS / Content

| Route | File | Purpose | Primary API | Module | Phase |
|---|---|---|---|---|---|
| `/legal/pages` | `pages/(admin)/legal/pages/index.tsx` | Static / legal pages list | — (needs spec) | cms | 1 |
| `/legal/pages/$pageSlug` | `pages/(admin)/legal/pages/$pageSlug.tsx` | Edit a legal page | — (needs spec) | cms | 1 |
| `/legal/banners` | `pages/(admin)/legal/banners.tsx` | Home banners / hero slides | — (needs spec) | cms | 2 |
| `/legal/config` | `pages/(admin)/legal/config.tsx` | App config — min order, fees, ETA | — (needs spec) | cms | 2 |

## CRM / Engagement

| Route | File | Purpose | Primary API | Module | Phase |
|---|---|---|---|---|---|
| `/customers/broadcasts` | `pages/(admin)/customers/broadcasts/index.tsx` | Push / SMS / email / WhatsApp | `admin/notifications/broadcasts` | crm | 2 |
| `/customers/broadcasts/new` | `pages/(admin)/customers/broadcasts/new.tsx` | Compose + target + schedule | `admin/notifications/broadcast` | crm | 2 |
| `/customers/journeys` | `pages/(admin)/customers/journeys.tsx` | Automated journeys | — (needs spec) | crm | 3 |

## Support / Helpdesk

> **No API spec exists** for this module.

| Route | File | Purpose | Primary API | Module | Phase |
|---|---|---|---|---|---|
| `/operations/tickets` | `pages/(admin)/operations/tickets/index.tsx` | Ticket queue | — (needs spec) | support | 2 |
| `/operations/tickets/$ticketId` | `pages/(admin)/operations/tickets/$ticketId.tsx` | Ticket detail + approvals | — (needs spec) | support | 2 |

## Pricing & Merchandising

> **No API spec exists** for this module.

| Route | File | Purpose | Primary API | Module | Phase |
|---|---|---|---|---|---|
| `/catalog/pricing` | `pages/(admin)/catalog/pricing.tsx` | Price zones, surge, delivery-fee rules | — (needs spec) | pricing | 3 |
| `/catalog/merchandising` | `pages/(admin)/catalog/merchandising.tsx` | Search relevance, recommendations | — (needs spec) | pricing | 3 |

## Platform (flags, experiments, BI, ops)

> **No API spec exists** for flags, experiments, or BI.

| Route | File | Purpose | Primary API | Module | Phase |
|---|---|---|---|---|---|
| `/platform/flags` | `pages/(admin)/platform/flags.tsx` | Feature flags + kill switches | — (needs spec) | feature-flags | 2 |
| `/platform/experiments` | `pages/(admin)/platform/experiments.tsx` | A/B tests | — (needs spec) | experiments | 3 |
| `/overview/bi` | `pages/(admin)/overview/bi.tsx` | Event taxonomy + funnels | — (needs spec) | analytics-bi | 2 |
| `/staff` | `pages/(admin)/staff/index.tsx` | Staff management + roles | `admin/staff` | rbac | 2 |
| `/staff/audit-log` | `pages/(admin)/staff/audit-log.tsx` | Admin audit log | — (needs spec) | platform-ops | 2 |
| `/platform/integrations` | `pages/(admin)/platform/integrations.tsx` | Razorpay, MSG91, Resend, FCM, Maps, 3PL | — (needs spec) | platform-ops | 2 |
| `/platform/system` | `pages/(admin)/platform/system.tsx` | Health, webhooks, API keys, backups | — (needs spec) | platform-ops | 2 |

## System

| Behavior | File | Notes |
|---|---|---|
| Role gate | `src/pages/(admin)/_layout.tsx` | `beforeLoad` → session + role; redirects to `/login` or `/forbidden` |
| Admin shell | `src/core/layout/admin-layout.tsx` | Sidebar + header + breadcrumbs + `<Outlet />` |
| 404 Not Found | `src/core/components/not-found.tsx` | `defaultNotFoundComponent` in `main.tsx` |
| Placeholder | `src/core/components/coming-soon.tsx` | Shared body for unbuilt (Phase 2/3) pages |
| API client | `src/core/api/client.ts` | Envelope unwrap + `ApiError` + pagination |
| List pattern | `src/core/api/use-paginated-list.ts` | Shared react-query + react-table hook |
| Root layout | `src/pages/__root.tsx` | Query provider + theme + toaster shell |

## Open questions

1. **Roles conflict.** api-plan §15k lists 5 (`superadmin | admin | catalog_manager |
   support | finance`); [`features.md`](./features.md) §1 lists 6 (adds `ops`). This spec
   assumes **6** — the dark-store fleet model needs `ops`.
2. **~40% of features.md has no API.** Modules 5 (inventory/hubs), 7 (fleet), 15 (flags),
   16 (experiments), 17 (BI), 18 (helpdesk), 19 (pricing) have zero §15 endpoints. The
   whole dark-store + fleet operating model is unspecified.
3. **api-plan roadmap is stale.** It puts all admin work in Phase 3, but features.md marks
   ~12 admin features P1/P0, and catalog/order tooling is a hard prerequisite for the
   storefront's Phase 1.
