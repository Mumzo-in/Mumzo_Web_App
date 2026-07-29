# Mumzo — Dev Sprint Plan (Jul 29 – Aug 15) + Testing Week

> **Companion to** [`mumzo_project_plan.md`](./mumzo_project_plan.md) (module/status source of
> truth) and [`checklist/mumzo_predev_checklist.md`](./checklist/mumzo_predev_checklist.md)
> (vendor lead times). This doc schedules that scope against a hard date, task-by-task.
>
> **Today:** 2026-07-29 · **Dev-complete target:** 2026-08-15
> **Testing & bug-fix week:** 2026-08-17 → 2026-08-22
> **Legend:** `BE` server/DB · `PF` platform (storefront) · `AD` admin panel

---

## 0. Assumptions

- **Single fast dev**, not parallel tracks — solo build across BE, PF, AD, one module at a time.
- **Money path first, aggressively:** Cart → Orders → Payments → Checkout targeted for
  **Jul 29 – Aug 1 (4 days)**. Addresses is small (schema + 4 fields + a form) and folds into
  Day 1 as a sub-task, not a day of its own.
- **Offline Aug 2–3.**
- **Aug 4 – Aug 15 (10 working days, Aug 9 Sunday off):** Referrals, delivery/ops, reviews,
  wishlist, notifications, then minor polish.
- Payments/OTP are built and tested against **sandbox/test credentials** throughout. Going live is
  an ops-owned gate (§2, §7), not a dev task — it does not block Aug 15.

---

## 1. Current State Snapshot

| Module | Status | Notes |
|---|---|---|
| Catalog (Products/Categories/Brands/Vendors/Hubs/Inventory) | ✅ | Full CRUD, BE+Admin+Platform |
| Auth | 🔶 | Phone OTP login (login=signup) fully built & working via `OTP_BYPASS`; real MSG91 SMS send pending DLT. Admin dashboard now shows real user counts + recent signups (`GET /admin/dashboard/user-counts`, `/recent-users`) |
| Admin Customer Directory | ✅ | `/platform/users/list` + `/platform/users/$userId` fully real, server-paginated (`GET /admin/users`); `/platform/users/analytics` real Recent Users table, mock growth/retention charts pending an `order` table |
| Home & Discovery | ✅ | Full page, categories/deals/bestsellers/brands |
| Search & Filters | ✅ | Filter panel, sort, URL state (basic `ILIKE`, not full-text) |
| Product Detail | ✅ | Gallery/sizes/price/highlights/related; reviews section missing |
| Coupons | ✅ | Admin CRUD + validate API; customer listing page not wired |
| Cart | ⬜ | Route exists, zero functionality |
| Orders | ⬜ | Routes exist (PF+AD), mock data only |
| Payments | ⬜ | Routes exist (PF+AD), no gateway integration |
| Checkout | ⬜ | Routes exist, no glue logic |
| Reviews | 🔶 | Route/placeholder pages only |
| Wishlist | 🔶 | Route + local-state toggle only |
| Referrals | 🔶 | Spec finalized, mock UI, no backend |
| Delivery & Dispatch | 🔶 | Admin dispatch/rider pages exist, no schema/API |
| Notifications | 🔶 | Route placeholders only |
| Addresses | ✅ | Schema+CRUD+list+form live; location picker (geolocation/OSM search) built in |

---

## 2. Day-0 Ops Checklist (parallel to dev, not a dev task)

| Item | Lead time | Blocks |
|---|---|---|
| Legal pages drafted (Privacy, T&C, Return, Shipping) | Same day | Razorpay KYC submission |
| Razorpay signup + KYC submitted | **3–7 days** | Live payments |
| Razorpay **test** keys | Same day | Nothing — unblocks dev immediately |
| MSG91 signup + DLT registration | **3–5 days** | Live OTP SMS |
| Resend account + domain DNS | 24–48h | Transactional email |
| Cloudflare R2 bucket | Same day | Image uploads |
| Google OAuth client ID | Same day | Google login |
| Firebase project + FCM key | Same day | Push notifications |
| `.env` filled with test/sandbox values | Same day | All of dev |

Full detail: [`checklist/mumzo_predev_checklist.md`](./checklist/mumzo_predev_checklist.md).

---

## 3. Phase 1 — Money Path: Jul 29 – Aug 1 (4 days)

> **Goal: guest → login via phone OTP → cart → checkout → pay (test mode/COD) → order visible in
> admin, fully working by Aug 1 EOD.**

### Day 1 — Jul 29 (Wed): Auth polish + Addresses (small) + Cart backend starts

**Auth (PF) — phone OTP login (login = signup, one flow) already works end-to-end via Better
Auth `phoneNumber` plugin (`sendOTP`/verify, `signUpOnVerification`). No sign-up form, no
email/password, no forgot/reset-password, no email verification page — none of that exists in
this app's auth model. Only remaining gap:**
- [x] Post-login redirect: preserve `?redirect=` param through the OTP flow, send back to cart/PDP/checkout step after verification

**Addresses (BE + PF) — small, do same day**
- [x] `address` table in `packages/db/src/schema`: userId, label, line1, line2, city, pincode, isDefault, lat/lng (nullable)
- [x] Migration via drizzle-kit
- [x] Platform API: `GET/POST /api/v1/addresses`, `PATCH/DELETE /api/v1/addresses/:id`, `POST /api/v1/addresses/:id/default`
- [x] Zod schema for pincode (6-digit) + required fields
- [x] PF: address list page wired (`/addresses`) — loading/empty states, real CRUD
- [x] PF: add/edit address form — went beyond plain text fields: location-picker flow (use current location or OpenStreetMap-backed address search, server-proxied, no API key) prefills the form; "Use my number" fills phone from the account session
- **Not done / deferred:** editing an existing address doesn't reuse the autocomplete flow (plain fields only); no server-side check for duplicate "Other" addresses; saved address pincode isn't cross-checked against real serviceability (checkout's gate still uses the separate mock `serviceAreas` state)

**Cart backend (BE) — start**
- [ ] `cart` + `cart_item` tables (userId nullable for guest, sessionId for guest cart)
- [ ] Migration
- [ ] `POST /api/v1/cart/items` — add item, validate stock from product size variant
- [ ] `PATCH /api/v1/cart/items/:id` — update qty
- [ ] `DELETE /api/v1/cart/items/:id` — remove item

### Day 2 — Jul 30 (Thu): Cart backend finish + Cart UI

**Cart backend (BE) — finish**
- [ ] `GET /api/v1/cart` — return items + computed totals (subtotal, GST 5%, delivery fee, discount, grand total)
- [ ] Coupon apply/remove on cart (reuse existing `POST /coupons/validate`, store applied coupon on cart)
- [ ] Guest cart via cookie/sessionId → merge into user cart on login (server-side merge on sign-in)
- [ ] `DELETE /api/v1/cart` — clear cart (used after order placement)

**Cart UI (PF)**
- [ ] Cart page layout: item list + sticky summary sidebar (desktop), stacked (mobile)
- [ ] Cart item card: image, name, size, qty stepper, remove button
- [ ] Price summary card: subtotal, GST line, delivery fee, discount line, total
- [ ] Coupon input + apply/remove, error state for invalid/expired coupon
- [ ] Empty cart state (use `Empty` component, not custom div)
- [ ] "Proceed to checkout" CTA — disabled + message under min-order threshold
- [ ] Header cart badge — item count, updates on add/remove
- [ ] Wire PDP "Add to cart" button to real API (currently toast-only) — keep the toast, add real mutation
- [ ] Out-of-stock handling on cart item (flag, block checkout if any OOS item present)

### Day 3 — Jul 31 (Fri): Orders backend + Payments backend

**Orders backend (BE)**
- [ ] `order` + `order_item` tables: snapshot product name/price/size at time of order (don't FK-only, denormalize price)
- [ ] Status enum: `pending_payment → confirmed → packed → shipped → out_for_delivery → delivered`, plus `cancelled`, `return_requested`, `returned`
- [ ] `order_status_log` table: orderId, fromStatus, toStatus, timestamp, actor
- [ ] `POST /api/v1/orders` — place order: validate cart not empty, validate stock again, snapshot items, create order row (status `pending_payment`), do NOT clear cart yet (clear after payment confirms)
- [ ] `GET /api/v1/orders` — list current user's orders, paginated
- [ ] `GET /api/v1/orders/:id` — detail with items + status timeline
- [ ] `POST /api/v1/orders/:id/cancel` — only allowed pre-`packed`, reason required

**Payments backend (BE)**
- [ ] `payment` + `refund` tables: orderId, provider (razorpay/cod), providerOrderId, providerPaymentId, status, amount
- [ ] Install Razorpay SDK, wire test `RAZORPAY_KEY_ID`/`SECRET` via `@mumzo/env`
- [ ] `POST /api/v1/payments/razorpay/order` — create Razorpay order for a given Mumzo order, return `order_id` for checkout.js
- [ ] `POST /api/v1/payments/razorpay/verify` — verify signature (`crypto.createHmac`), mark payment + order as `confirmed`, clear cart
- [ ] `POST /api/v1/payments/webhook` — handle async Razorpay events (`payment.captured`, `payment.failed`), idempotent (check `providerPaymentId` before writing)
- [ ] COD flow: `POST /api/v1/orders/:id/cod` — mark order `confirmed` directly, no Razorpay call, clear cart
- [ ] Payment retry: `POST /api/v1/payments/razorpay/order` re-callable for a `pending_payment` order

### Day 4 — Aug 1 (Sat): Checkout flow (glue) + Orders/Payments UI + Admin wiring

**Checkout flow (PF) — assembles everything above**
- [ ] Step indicator component: Address → Payment → Review
- [ ] Address step (`/checkout/address`): select saved address, "add new" inline form (reuse address form from Day 1)
- [ ] Payment step (`/checkout/payment`): method selector — UPI/Card/Netbanking/Wallet (all via Razorpay) vs COD
- [ ] Review step (`/checkout/review`): line items, address, payment method, persistent order-summary sidebar across all 3 steps
- [ ] Place order → if COD: call cod endpoint → redirect confirmation. If online: create order → create Razorpay order → open checkout.js popup → on success call verify → redirect confirmation
- [ ] Payment status page (`/payment/status`): success (order id, ETA), failure (retry button → re-open checkout.js), processing (poll or webhook-driven)
- [ ] Delivery slot: simple "Express 10-min" default selection (skip scheduled-slot complexity for now)

**Orders UI (PF) — wire off mock**
- [ ] Order history (`/orders`) → real `GET /orders`
- [ ] Order detail (`/orders/$orderId`) → real `GET /orders/:id`, render status timeline from log
- [ ] Cancel flow → real cancel endpoint, reason dropdown + confirm dialog

**Admin wiring (AD)**
- [ ] Orders list (`/operations/orders`) → real `GET /admin/orders`, filters by status/date
- [ ] Order detail (`/operations/orders/$orderId`) → real API
- [ ] Status transition control → `PATCH /admin/orders/:id/status`, validate legal transitions server-side
- [ ] Payments list (`/finance/payments`) → real `GET /admin/payments`
- [ ] Payment detail → real API, show Razorpay payment id + status

**Checkpoint Aug 1 EOD:** login via phone OTP → add to cart → checkout → pay (Razorpay test or COD) → order confirms → visible + status-transitionable in admin. If anything above slips, it takes priority over all Phase 2 scope on Aug 4.

---

## 4. Phase 2 — Referrals, Ops, Growth, Polish: Aug 4 – Aug 15

> Priority order top to bottom — cut from the bottom if time runs short. Aug 9 (Sun) off.

### Aug 4–5: Referrals (M8)

**Backend (BE)**
- [ ] Confirm/finish schema per [`referral_system_architecture.md`](./platform/referral_system_architecture.md): tier config, referral codes, referrals, earned coupons
- [ ] Tier config seed: 1/3/5/10 referrals → ₹150/400/600/2000
- [ ] Referral code generation on user signup (unique, short, human-shareable)
- [ ] `POST /api/v1/referrals/apply` — apply a referral code at signup
- [ ] 3-stage tracking: `link_shared → signed_up → order_placed → completed` — update stage on signup and on first order placement
- [ ] Settlement engine: cron/scheduled job — after order's return window expires, issue the referrer's coupon; if returned within window, revoke
- [ ] Hook into M1 signup flow (auto-apply code from `?ref=` param)
- [ ] Hook into M4 order placement (mark referee's first order)

**Platform (PF)**
- [ ] `/referrals` page wired off mock: real code, real share links (WhatsApp intent link + copy-to-clipboard)
- [ ] Tier ladder component wired to real progress
- [ ] Earned coupons list with status badges (pending/earned/revoked)
- [ ] Invite tracker: per-friend 3-stage progress
- [ ] `/r/$code` landing page: capture code, redirect to signup with it pre-filled

**Admin (AD)**
- [ ] Referral manager (`/customers/referrals`) wired to real list + stats
- [ ] Tier config CRUD UI

### Aug 6–7: Delivery / Ops basics (M13)

**Backend (BE)**
- [ ] `rider` table: name, phone, vehicle type, hub assignment, active status
- [ ] `delivery_assignment` table: orderId, riderId, assignedAt, status
- [ ] `POST /admin/orders/:id/assign-rider`
- [ ] `GET /admin/riders`, `POST /admin/riders`, `PATCH /admin/riders/:id` (CRUD + deactivate)
- [ ] Pincode → hub mapping table (which hub services which pincodes) — needed for serviceability check too

**Admin (AD)**
- [ ] Dispatch board (`/operations/dispatch`) wired: unassigned orders list, assign-rider action
- [ ] Rider CRUD pages (`/operations/riders`) wired to real API

**Platform (PF) — serviceability, small add-on**
- [ ] Pincode check on cart/checkout: `GET /api/v1/serviceability/:pincode` → gate checkout if unserviceable

### Aug 8: Reviews (M7)

**Backend (BE)**
- [ ] `review` table: productId, userId, orderId (verified-purchase link), rating, title, body, images[], status (pending/approved/rejected)
- [ ] `POST /api/v1/products/:id/reviews` — verify user has a `delivered` order containing this product before allowing submit
- [ ] `GET /api/v1/products/:id/reviews` — paginated, sort newest/rating
- [ ] On approve: recompute product's aggregate `rating` + `reviewCount` columns (already exist)

**Platform (PF)**
- [ ] Reviews page (`/product/$productId/reviews`): list + rating histogram
- [ ] "Write a review" form: star input, title, body, image upload (R2)
- [ ] PDP review summary: real avg + count (currently hardcoded count)
- [ ] Post-order "Write review" page wired

**Admin (AD)**
- [ ] Moderation queue (`/customers/reviews`) wired: approve/reject/delete actions

### Aug 10: Wishlist (M9)

**Backend (BE)**
- [ ] `wishlist_item` table: userId, productId, addedAt
- [ ] `GET/POST/DELETE /api/v1/wishlist`

**Platform (PF)**
- [ ] Wishlist page (`/wishlist`) wired: product grid, remove, move-to-cart
- [ ] PDP wishlist toggle wired to real API (currently local state only)

### Aug 11: Notifications — basic (M11)

**Backend (BE)**
- [ ] `notification` table: userId, type, title, body, read, createdAt
- [ ] Trigger notification creation on order status change (order placed, packed, out for delivery, delivered, cancelled)
- [ ] `GET /api/v1/notifications`, `PATCH /api/v1/notifications/:id/read`

**Platform (PF)**
- [ ] Notification center (`/notifications`) wired to real list
- [ ] Header bell icon with unread count badge

### Aug 12–13: Minor stuff / polish (cross-cutting)

- [ ] Footer component (PF) — links, static pages, socials
- [ ] Bottom nav bar (PF, mobile) — home/search/cart/orders/profile
- [ ] Sticky mobile add-to-cart bar on PDP (PF)
- [ ] PDP delivery estimate text ("10 min") (PF)
- [ ] Reorder button on order detail → re-adds items to cart (PF)
- [ ] Coupon customer-listing page (`/offers`) wired to real coupon list + eligibility (PF)
- [ ] Brand detail page (`/brand/$brand`) wired — hero + product listing (PF, API already exists)
- [ ] Collection detail page wired, or confirm static data is acceptable for launch (PF)
- [ ] Invoice download — stub as "email me the invoice" or simple non-GST receipt PDF if GST reg isn't done yet (BE + PF)

### Aug 14–15: Buffer

- [ ] Absorb any slippage from Aug 4–13 first, in the priority order above
- [ ] If clear: Sentry error reporting stub, basic analytics event tracking (GA4/PostHog) on key funnel steps (view PDP, add to cart, checkout start, order placed)

---

## 5. Explicit Descope / Fast-Follow (does not fit by Aug 15)

- **Live SMS delivery for OTP (real MSG91 send)** — login flow itself is fully built (phone + OTP, login = signup); only the actual SMS provider wiring is pending DLT registration. Dev/test runs on `OTP_BYPASS` (fixed code `111111`) until MSG91 is approved. Google OAuth — not started, fast-follow after Aug 15
- **Full-text search** (Typesense/tsvector), autocomplete, typo tolerance, trending/recent searches
- **Subscriptions** ("Subscribe & Forget") — entire module
- **3PL integration** (Shiprocket/Delhivery), COD reconciliation reporting
- **Vendor CSV import, Purchase Orders, GRN**
- **Multi-language (EN/HI/TE), loyalty/points, product compare, offline/service-worker caching**
- **GST invoicing (real PDF w/ GSTIN/HSN)** — blocked on GST registration lead time regardless; stub receipt only

---

## 6. Testing & Bug-Fix Week — Aug 17 → Aug 22

> Aug 16 (Sunday) off.

| Day | Focus |
|---|---|
| **Aug 17 (Mon)** | **Smoke test.** Every route loads, no console errors, auth guard redirects correctly, `bunx tsc --noEmit` + `biome check` clean across `apps/platform`, `apps/admin`, `apps/server`. |
| **Aug 18 (Tue)** | **Money-path integration test.** Guest → signup → browse → add to cart → checkout → Razorpay test payment → order confirmation → order visible in admin → status transition → customer sees update. Test COD path separately. Test payment failure + retry path. **⚠️ Checkpoint:** if Razorpay live KYC is still pending, confirm test-mode is fully solid and plan the live-key swap as a same-day cutover once approved. |
| **Aug 19 (Wed)** | **Secondary flows.** Reviews (submit + moderate), wishlist, referrals end-to-end (signup via link → order → settlement), search/filter edge cases, admin dispatch/rider assignment. |
| **Aug 20 (Thu)** | **Cross-device / edge cases.** Mobile viewport pass (PWA is mobile-first), empty states, error states, slow-network behavior, out-of-stock handling, min-order validation, expired/invalid coupon, invalid pincode. |
| **Aug 21 (Fri)** | **Bug triage + fix day 1.** Bucket everything found Aug 17–20 by severity (blocker / major / minor). Fix all blockers + majors. |
| **Aug 22 (Sat)** | **Bug fix day 2 + soft-launch go/no-go.** Finish remaining fixes, re-run smoke test. List any still-pending vendor gates (live Razorpay, DLT'd MSG91) as known risks, not blockers. |

---

## 7. Risks / Deadlock Register

| Risk | Lead time | Mitigation | Owner |
|---|---|---|---|
| **Phase 1 is very tight (4 days for the entire money path)** | N/A | Any slip Jul 29–31 eats the Aug 1 checkout buffer directly — if checkout isn't glued by Aug 1 EOD, Aug 4 should finish it before starting Referrals | You |
| **Razorpay live KYC** | 3–7 days | Submit Day 0; dev proceeds on test keys unaffected; live cutover whenever approved | Founders/Finance |
| **MSG91 DLT registration** | 3–5 days | Submit Day 0; OTP login flow itself is already built and testable via `OTP_BYPASS` — this only gates *real SMS delivery*, not dev/testing progress | Founders |
| **GST registration** | Variable, can be weeks | Real invoicing likely slips past Aug 22 — stub receipt in the interim | Finance |
| **Legal pages (Privacy/T&C/Return)** | Blocks Razorpay KYC submission itself | Draft Day 0, even as a Google Doc turned into a static page same day | Founders/Legal |
| **Resend DNS propagation** | 24–48h | Kick off Day 0, non-blocking for dev | Founders |

---

## 8. Critical Path Reminder

**Auth → Cart → Orders → Payments → Checkout** is the money path (Phase 1, Jul 29–Aug 1).
Everything in Phase 2 (Referrals, Delivery/Ops, Reviews, Wishlist, Notifications, polish) is P1
and layers on top — if Phase 1 slips past Aug 1, Phase 2 scope is what gets cut, not the other
way around.
