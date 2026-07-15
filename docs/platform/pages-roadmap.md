# Mumzo Platform — Pages Inventory

Every page that exists in `apps/platform` today. This is the reference for building the API and
the SuperAdmin — each page below needs data behind it.

Status: all pages are built and navigable, but run on **mock data + localStorage**. Nothing is
wired to the Hono/Drizzle API yet.

Legend:
- `(store)` = public route
- `(store)/(protected)` = requires auth (guarded by `(protected)/_layout.tsx`, redirects to login)

---

## Public — storefront

- `/` — Home. Hero carousel, value props, category grid, top deals rail, offers strip, bestsellers rail, collections rail, brand cards, "more to explore" grid + view more.
- `/search` — Search & category browse. Keyword `?q=` + category `?cat=`. Filters: age, type, brand, max price, size. Sorts: recommended, price asc/desc, discount, rating. Desktop sidebar + mobile filter dialog.
- `/product/$productId` — Product detail. Image carousel, size selector, qty selector, add to cart, wishlist heart, brand link, related products, accordion info.
- `/product/$productId/reviews` — All ratings & reviews. Average, star distribution bars, filter by star, helpful votes.
- `/product` — Redirects to `/search`.
- `/collection` — All collections index.
- `/collection/$slug` — Single collection. Hero image, curated product grid, other collections rail.
- `/brand` — All brands index.
- `/brand/$brand` — Single brand. Brand header, that brand's products, other brands.
- `/offers` — All offers & coupons. Copy code, min order value, T&C note.
- `/cart` — Cart. Line items, qty, coupon box (accordion + coupon cards), bill summary, not-serviceable banner, place order.

## Public — profile (unprotected today)

- `/profile` — Account home. User card, log out, menu (orders, addresses, wishlist, baby profiles, notifications) + Settings group.
- `/profile/baby` — Baby profiles. Add/edit/delete, age slider (0–60 months), live milestone preview.

> Note: `/profile` and `/profile/baby` sit outside `(protected)` while the sub-pages under it are protected. Worth aligning.

## Public — content & legal

- `/about` — Brand story, values grid, CTA.
- `/contact` — Contact details + message form.
- `/help` — Help centre. Quick links (track order, contact) + FAQ accordion.
- `/legal/terms` — Terms & conditions.
- `/legal/privacy` — Privacy Notice (DPDP-grade: data categories + purposes, consent, children's data, processors, retention, rights, cookies, security, grievance officer, DPB escalation).
- `/legal/shipping` — Shipping & delivery policy.
- `/legal/returns` — Returns & refunds policy.

## Auth

- `/auth/login` — Sign in (phone + OTP).
- `/auth/register` — Sign up (name + phone → OTP). Includes DPDP consent notice: itemised purposes, required Terms/Privacy checkbox, separate optional marketing opt-in.
- `/auth/otp` — Standalone OTP verification (6-digit input, resend timer).

## Protected — checkout

- `/checkout` — Redirects to `/checkout/address`.
- `/checkout/address` — Step 1. Select/add address, delivery mode (express vs scheduled), day + time-window picker. Hard-gated if location is unserviceable.
- `/checkout/payment` — Step 2. Address + slot recap, payment method selector (UPI / card / netbanking / wallet / COD).
- `/checkout/review` — Step 3. Full recap with edit links, item list, bill, place order.
- `/payment/status` — Payment result. `?status=success|failed|pending`, order ref, track order / retry / continue shopping.

## Protected — orders

- `/orders` — Order list. Tabs: all / active / delivered / cancelled.
- `/orders/$orderId` — Order detail. Status timeline, items, bill, address, reorder, rate, return, help, invoice.
- `/orders/$orderId/tracking` — Live tracking. Rider card, ETA, mock map, status timeline.
- `/orders/$orderId/return` — Return request. Select items, reason, note.
- `/orders/$orderId/review` — Rate order. Per-item star rating, headline, body, photos (mock).
- `/orders/$orderId/help` — Raise a ticket for this order. Topic picker + details.

## Protected — support

- `/support` — Ticket list with status.
- `/support/$ticketId` — Ticket thread. Messages + reply box (canned auto-reply).

## Protected — account

- `/addresses` — Saved addresses. Add/edit/delete, set default.
- `/wishlist` — Saved products grid.
- `/notifications` — In-app inbox. Order / offer / system types, read-unread, mark all read.
- `/referrals` — Refer & earn. Code, copy, WhatsApp share, how it works, invite list.
- `/profile/edit` — Edit name, phone (re-verify), email, language (EN/HI/TE), avatar.
- `/profile/payment-methods` — Saved UPI / cards. Add, set default, remove.
- `/profile/notifications` — Notification settings. Channels (push/SMS/email/WhatsApp) × categories (orders/offers/recommendations).
- `/profile/privacy` — Privacy & data (DPDP hub). Manage consents, download my data, nominee, grievance officer, delete account.

## Global / non-route surfaces

- Header — logo, location selector (shows ETA / scheduled / not-serviceable), search, notifications bell, cart count, login.
- Footer — shop by category, help links, company links, legal links.
- Bottom nav — mobile.
- Location modal — pincode/area check with live express / scheduled / unserviceable feedback.
- Consent banner — DPDP cookie/tracking consent (accept all / reject all / manage granular).
- Not-serviceable screen — shown on cart + checkout when out of zone.
- 404 not found.
- Toasts (sonner).

---

## Data currently mocked (what the API must provide)

- `core/data.ts` — categories, products, offers. 30 products across 9 categories.
- `catalog/data/brand-data.ts` — brands derived from products.
- `catalog/data/collection-data.ts` — 5 curated collections.
- `catalog/data/product-attributes.ts` — age groups + product type per product. **Not fields on Product yet — API should add them.**
- `catalog/data/review-data.ts` — product reviews.
- `catalog/data/category-config.ts` — sorts, filter state, facets, filter logic.
- `orders/data/order-data.ts` — orders, statuses, rider info.
- `checkout/data/slot-data.ts` — delivery days + time windows.
- `checkout/data/checkout-data.ts` — payment methods.
- `location/data/serviceability-data.ts` — 8 Hyderabad areas, express vs scheduled zones.
- `support/data/ticket-data.ts` — tickets, help topics.
- `account/data/` — addresses, notifications, baby profiles.
- `home/data/hero-slides.ts` — hero carousel slides.

## Client state (localStorage keys)

- `mumzo_cart_v1` — cart items
- `mumzo_wishlist_v1` — wishlist product ids
- `mumzo_addresses_v1` — addresses
- `mumzo_profile_v1` — profile (name, phone, email, language)
- `mumzo_payment_methods_v1` — saved payment methods
- `mumzo_notif_prefs_v1` — notification channel prefs
- `mumzo_consents_v1` — DPDP consent records (+ `mumzo_consents_decided_v1`)
- `mumzo_location_v1` — chosen location
- `mumzo_nominee_v1` — DPDP nominee

## Not built (out of scope for now)

- Wallet / credits
- Subscriptions
- Forgot password (OTP-only auth)
- Blog / content hub
- PWA offline screen + install prompt
- Global error boundary, loading skeletons, unified empty state, route-level not-found wiring

## Known gaps

- Placing an order doesn't create an order record — orders are static mock data, so the chosen slot/address/payment aren't persisted onto an order.
- Product detail brand link still uses the old `$slug` param after the route was renamed to `$brand`.
- Reviews are read-only — the rate-order flow doesn't write into the review list.
- Order updates / notifications are seeded, not generated by events.
