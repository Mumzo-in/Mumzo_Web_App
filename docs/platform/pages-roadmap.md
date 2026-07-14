# Mumzo Platform — Next Pages Roadmap

Planning doc for the next wave of storefront pages + DPDP Act compliance. Frontend-first
(mock data + localStorage), same conventions as the built pages. Nothing here is built yet.

Legend — Route group: `(store)` public, `(store)/(protected)` needs auth.

Explicitly **out of scope** (per product call): wallet/credits, subscriptions, forgot-password
(OTP only), blog/content hub. Email is fine as a channel.

**Container width rule:** every page container uses `mx-auto w-full max-w-7xl` — never a max
width smaller than `max-w-7xl` (no `max-w-[900px]`, `max-w-2xl`, etc.).

---

## 1. Account & profile

Settings live **under profile**, reached from the profile page itself (a "Settings" section in
the profile menu). No separate `/settings` top-level.

- **Profile edit** — `(store)/(protected)/profile/edit`
  - Edit name, phone (with OTP re-verify stub), email, language (English/Hindi/Telugu), avatar.
  - Reuses `Input`/`Label`/`Button`; saves to a new `account` profile store (localStorage).
  - Also serves DPDP "right to correction".

- **Saved payment methods** — `(store)/(protected)/profile/payment-methods`
  - List saved UPI IDs / masked cards, add (mock), set default, remove.
  - New `payment-methods` store; checkout `PaymentMethodSelector` reads saved methods.

- **Notification & consent settings** — `(store)/(protected)/profile/notifications`
  - Per-channel toggles: Push / SMS / Email / WhatsApp × Orders / Offers / Recommendations.
  - Marketing consent is separate + withdrawable (DPDP). Stored as a consent record.

- **Privacy & data (DPDP hub)** — `(store)/(protected)/profile/privacy`
  - Download my data (export), Delete my account, Manage consents, Nominee, Grievance officer.
  - See DPDP section for the sub-flows.

> The profile page (`/profile`) gets a **Settings** group linking to Edit profile · Payment
> methods · Notifications · Privacy & data. These profile sub-pages are protected.

## 2. Offers, coupons & referrals

- **Offers & coupons** — `(store)/offers` (public)
  - Browse all active offers/coupons, copy code, "how it works", T&C link.
  - Reuses `CouponCard`; data from `core/data` offers.
  - **Also surface an offers section on the home page** (`(store)/index`) — a horizontal
    offers strip/carousel linking into `/offers`.

- **Referrals** — `(store)/(protected)/referrals`
  - Referral code + share (WhatsApp/copy), reward explainer, invite status list.
  - New `referrals` mock store.

## 3. Orders — support & reviews

- **Rate & review an order** — `(store)/(protected)/orders/$orderId/review`
  - Per-item star rating + title/body + photo upload (mock), verified-purchase badge.
  - Writes into `catalog` review store; product reviews page reads it.

- **Order help / raise a ticket** — `(store)/(protected)/orders/$orderId/help`
  - Issue picker (missing item, damaged, late, refund…) → creates a support ticket.

- **Support tickets** — `(store)/(protected)/support` + `support/$ticketId`
  - Ticket list (status) and thread view (canned replies + message box, mock chat).
  - New `support` module + mock ticket store.

## 4. Discovery — serviceability, slots, collections

- **Serviceability gate** — component + `(store)/not-serviceable` state
  - Pincode check on the location modal; if out of zone show a "not delivering here yet"
    screen with notify-me. Blocks checkout for unserviceable pincodes.
  - New `serviceability` helper in `location` module (mock serviceable pincode list).

- **Scheduled delivery** — enhance checkout, add `(store)/(protected)/checkout/slot` step
  - Upgrade `SlotSelector` into Express vs Scheduled with a day + time-window calendar.
  - Feeds slot into order + review recap.

- **Collections** — `(store)/collection/$slug` (public)
  - Curated product grids (e.g. "Newborn essentials", "Monsoon care"); reuses `ProductCard`
    + filters. Mock collections in `catalog`.

- **Brand pages** — `(store)/brand/$slug` (public)
  - Brand header + that brand's products; reuses category browse layout.

## 5. Global states & base infra (cross-cutting, not routes)

- **Route error boundary** — `errorComponent` on `__root` (+ per-route) with a branded retry.
- **Pending / loading UI** — `pendingComponent` / route `Loader`; skeletons on lists & detail.
- **Empty states** — standardise a reusable `EmptyState` in `core` (cart, orders, wishlist,
  search, notifications already have bespoke ones — unify them).
- **404 not-found** — exists; wire a route-level `notFoundComponent` everywhere.
- **Offline / PWA** — offline fallback screen + install prompt + "you're offline" banner.
- **Network/error toasts** — standard failure handling helper.
- **Scroll-restoration & top-of-page on nav** — base router polish.

---

## 6. DPDP Act (Digital Personal Data Protection Act, 2023) — compliance surfaces

Mumzo processes personal data of parents **and** references children (baby profiles), so DPDP's
children provisions matter. Frontend deliverables:

- **Consent notice at signup** — clear, itemised notice: what data, purposes, that consent can
  be withdrawn, link to full privacy notice. Separate opt-ins (don't bundle marketing with
  service). Available in English/Hindi/Telugu.
- **Consent manager** — `settings/privacy` → Manage consents: view each purpose (service,
  marketing, analytics, personalisation), granular toggle, **withdraw as easily as given**,
  with timestamped consent records (mock store).
- **Cookie / tracking consent banner** — first-visit banner (Accept / Reject / Manage), stored
  choice, gates analytics/experimentation loading. New `consent` module + `ConsentProvider`.
- **Privacy notice (itemised)** — upgrade `legal/privacy` to DPDP-grade: data categories,
  purposes, retention, third parties, Data Principal rights, Grievance Officer, DPB escalation.
- **Right to access / data export** — `settings/privacy` → Download my data (JSON/PDF mock),
  covers profile, orders, addresses, consents.
- **Right to correction** — covered by Profile edit + address/baby editing.
- **Right to erasure** — `settings/privacy` → Delete my account: reason, consequence notice,
  confirm (re-auth/OTP), grace-period message. Clears local stores in the mock.
- **Grievance redressal** — named Grievance Officer + contact + a grievance form with SLA note
  (DPDP requires a response timeline). Can live under `settings/privacy` and `/contact`.
- **Nomination** — `settings/privacy` → Nominee: name a person to exercise rights in case of
  death/incapacity (DPDP §14).
- **Children's data safeguards** — verifiable parental-consent affirmation when adding a baby
  profile; **no behavioural tracking / targeted ads keyed to children's data**; internal note
  in the privacy notice. (Age-based *recommendations* stay, ad-targeting on child data does not.)
- **Consent artifacts & audit (backend, note only)** — store consent version, timestamp,
  purpose, withdrawal; retention schedule; breach-notification pipeline. Flagged for the API,
  not a storefront page.

---

## 7. Suggested build order

1. Global base infra (error/loading/empty/not-found boundaries) — unblocks everything.
2. Settings shell + Profile edit + Notification/consent settings.
3. DPDP: consent banner + consent manager + privacy notice upgrade + export/delete/grievance/nominee.
4. Payment methods.
5. Order review + order help + support tickets.
6. Serviceability gate + scheduled delivery.
7. Offers page + referrals.
8. Collections + brand pages.

## New modules introduced

- `consent` (DPDP: ConsentProvider, banner, records)
- `support` (tickets)
- `serviceability` (helper in `location`)
- stores added to `account` (profile, payment-methods, notification prefs, nominee)
- `referrals`, collections/brands data in `catalog`
