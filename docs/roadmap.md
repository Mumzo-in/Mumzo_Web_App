# Mumzo — Build Roadmap

Where to start, and in what order, now that auth and the server skeleton exist.

---

## The question this answers

> Should admin and platform be built in parallel — catalog admin + catalog
> storefront together, then inventory, and so on?

**Mostly yes, but not symmetrically.** Pair them *per domain*, and always run
**admin first, platform second** within each domain. The two apps are not at
the same maturity level, and treating them as equal halves is the one thing
that will hurt.

---

## What the two apps actually look like today

| | Admin | Platform |
|---|---|---|
| API layer | `core/api/client.ts` — typed, envelope-aware, ready | **None** |
| Data fetching | TanStack Query + query-key factory | **No react-query dependency** |
| How components get data | `useQuery` → `api/*.ts` → mock helper | Direct import of seed arrays |
| Mutable state | Server-owned | **7 localStorage contexts** |
| Real UI pages | ~11 | ~50 (all of them) |
| `<ComingSoon>` pages | **43** | 0 |

Two asymmetries drive everything below.

**Admin is plumbed but hollow.** Its data layer was built API-first: swapping a
module from mock to live is a one-file body change, and several files already
document their target call in a comment. But 43 of its pages are placeholders.

**Platform is complete but unplumbed.** Every page is real and navigable, and
none of it can talk to a server. `core/data.ts` exposes *synchronous* lookups
(`findProduct`, `productsInCategory`) called during render — converting those
to fetches touches every consuming component, not one file.

So "wire up admin catalog" is an afternoon. "Wire up platform catalog" is a
week, and the first one pays for a foundation the rest reuses.

---

## Phase 0 — Foundations (do this before any domain)

Two prerequisites. Skipping them means paying for them repeatedly, once per
domain.

**0a. Admin: prove `client.ts` against a live endpoint.**
It is currently dead code — nothing imports `apiRequest`/`apiList`. Written but
never exercised means first-integration surprises: real 401 handling, error
boundaries, abort behaviour. Wire *one* module (dashboard — a single
non-paginated `mockDetail`) end to end and fix what breaks.

Also give `BASE_URL` an env override. It is a hardcoded `"/api/v1/admin"`,
unlike the auth clients which derive origin properly. Fine while the Vite proxy
makes everything same-origin; breaks the moment admin deploys separately.

**0b. Platform: build the API layer that does not exist.**
Add `@tanstack/react-query`, then port admin's three primitives — `client.ts`,
`query-keys.ts`, `mock.ts`. Same envelope, same pagination contract, so the two
apps stay symmetrical from here on. Keep the mock helpers: they let platform
modules convert to async *before* their endpoint exists, which is what makes
the per-domain pairing work.

*Estimate: ~1 week. Everything after depends on it.*

---

## The domain sequence

Each domain: **schema → admin API → admin UI → platform API → platform UI.**
Admin first is not a preference — it is how you get data into the system to
build the storefront against.

### 1. Catalog (products, categories, brands)

The natural starting point: no dependencies, both apps have real UI, and it
unblocks everything downstream.

- Schema: `product`, `product_variant`, `category`, `brand`, `collection`
- Admin: list/detail/create/update — the module is already fully stubbed
- Platform: category pages, PDP, search, home

**Watch for:** `packages/catalog-model` types were written as the DB's shape but
no Drizzle table mirrors them yet. Reconcile that first — it is the contract
both apps already import. Also `sizes[]` must become `product_variant` rows
(a JSON array cannot be inventory-tracked per hub), while the API keeps
returning the `sizes` shape the frontend expects.

**Platform's real cost here** is converting `core/data.ts`'s synchronous
lookups to async. That is the one-time tax Phase 0b sets up.

### 2. Serviceability + hubs

Small, and a hard prerequisite for cart. The pincode gate already blocks
cart and checkout client-side; it needs a server behind it.

- Schema: `hub`, `zone`, `zone_pincode`, `delivery_slot`
- Platform: replaces the 8 hardcoded Hyderabad areas

**Note:** the current gate is client-side only. Order placement must
re-validate server-side regardless.

### 3. Inventory

Do this **after** catalog and **before** cart. Ordering matters: cart needs to
know what is in stock, and `product.stock` cannot stay a scalar once multi-hub
is real.

- Schema: `hub_inventory`, `stock_batch`, `stock_ledger`, `inventory_hold`
- Admin: 3 inventory pages are ComingSoon — real UI work, not just wiring

This is where the two apps stop being symmetric: inventory is almost entirely
an admin surface. Platform only consumes an availability flag.

### 4. Cart → Order → Payment

The revenue path, and the highest-risk work in the project. Do it as one block,
not three.

- Schema: `cart`, `order`, `order_item`, `payment`, `coupon`, `webhook_event`
- Platform: cart and checkout providers move from localStorage to server
- Admin: order list/detail already have real UI and stubbed APIs

**The hard part is not the endpoints.** It is inventory reservation, order
idempotency, and Razorpay webhook handling — see the architecture plan's §4.
Also guest→auth cart merge, which has no equivalent in the current localStorage
providers: they have no concept of a server round-trip or conflict.

### 5. Account (addresses, profile, babies, wishlist)

Deliberately after checkout. Addresses are needed *by* checkout, so ship a
minimal address CRUD inside phase 4 and do the rest here.

This is the second localStorage cluster — 7 providers. Treat persistence
migration as its own workstream with a one-shot import on first authenticated
boot, not as a per-module afterthought.

### 6. Engagement (reviews, notifications, support, referrals, subscriptions)

Lower risk, independently shippable, parallelisable across people once the
foundations exist.

---

## Where parallelism actually helps

Within a domain, admin and platform are sequential — platform needs data that
admin creates. **Across** domains they overlap:

```
        ┌─ Catalog admin ──┬─ Catalog platform ──┐
Phase 0 ┤                  │                     ├─ Cart/Order/Payment
        └─ Serviceability ─┴─ Inventory ─────────┘
```

With two people: one on the admin/schema side, one running a domain behind on
platform. With one person, just follow the order.

**What not to parallelise:** cart, order, and payment. They share the
reservation and state-machine invariants, and splitting them across people is
how you get a cancel path that forgets to release stock.

---

## Two decisions to make now

**1. Are the 43 ComingSoon admin pages in scope?**
Several sit on modules whose data layer is already built (coupons, payments,
category new/edit) — those are pure UI work with the plumbing done. Others
(dispatch, riders, BI, experiments) are whole features with no schema yet.
Worth splitting explicitly rather than discovering it mid-phase.

**2. Does platform keep localStorage as a cache?**
Two options: server-only (simpler, but the cart empties on a flaky connection),
or server-backed with localStorage as an offline cache (better UX, needs
conflict resolution). Decide before phase 4 — it changes the cart provider's
shape.

---

## Suggested start

1. **Phase 0a** — wire admin dashboard to a live `/api/v1/admin/dashboard`.
   Small, proves `client.ts`, surfaces integration surprises early.
2. **Phase 0b** — react-query + API layer in platform.
3. **Catalog schema** — reconcile `packages/catalog-model` with Drizzle tables.
4. **Catalog admin**, then **catalog platform**.

By the end of that you have one domain running end-to-end through both apps,
and every later domain is a repeat of a proven shape.
