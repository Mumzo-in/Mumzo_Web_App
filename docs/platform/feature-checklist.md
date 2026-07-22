# Mumzo Platform — Feature Checklist

> **Legend:**  
> `UI` ✅ = component/page built · `BE` ✅ = API endpoint implemented · `🔗` ✅ = frontend wired to real API  
> `⬜` = not yet built · Rendering unverified (pixel review is human's job)

---

## 🏠 Home Page (`/`)

| Feature | UI | BE | 🔗 |
|---------|----|----|-----|
| Hero carousel (auto-play, CMS data) | ✅ | ⬜ | ⬜ |
| Value props strip (10-min · genuine · safe) | ✅ | — | — |
| **Shop by Category** grid | ✅ | ✅ `GET /api/v1/categories` | ✅ |
| **Top deals** product rail (by discount %) | ✅ | ✅ `GET /api/v1/products` | ✅ |
| **Offers for you** strip | ✅ | ✅ `POST /api/v1/coupons/validate` | ⬜ |
| **Bestsellers** product rail | ✅ | ✅ `GET /api/v1/products` | ✅ |
| **Collections** horizontal scroll | ✅ | ⬜ (static data) | ⬜ |
| **Shop by Brand** grid | ✅ | ✅ `GET /api/v1/brands` | ✅ |
| **More to explore** product grid | ✅ | ✅ `GET /api/v1/products` | ✅ |
| Personalised "For you" rail | ⬜ | ⬜ | ⬜ |
| Recently viewed rail | ⬜ | ⬜ | ⬜ |
| Subscribe & Forget upsell banner | ⬜ | ⬜ | ⬜ |

---

## 🔍 Search / Category Page (`/search`)

| Feature | UI | BE | 🔗 |
|---------|----|----|-----|
| URL-driven state (all filters/sort in params) | ✅ | — | — |
| Breadcrumbs (dynamic) | ✅ | — | — |
| Page title + product count + tagline | ✅ | — | — |
| Category chips (inline switcher, no nav) | ✅ | ✅ `GET /api/v1/categories` | ✅ |
| **Desktop sticky sidebar** filter panel | ✅ | — | — |
| **Mobile filter dialog** (bottom sheet) | ✅ | — | — |
| Sort: Relevance · Price · Discount · Rating | ✅ | ✅ (query param) | ✅ |
| Filter by brand (checkboxes, facet-driven) | ✅ | ✅ (query param) | ✅ |
| Filter by size (checkboxes, facet-driven) | ✅ | ✅ (query param) | ✅ |
| Filter by max price (slider) | ✅ | ✅ (query param) | ✅ |
| Filter by age group (client-side) | ✅ | ⬜ | ⬜ |
| Filter by product type (client-side) | ✅ | ⬜ | ⬜ |
| Loading skeleton grid | ✅ | — | — |
| Empty state + "Clear filters" | ✅ | — | — |
| Product results grid | ✅ | ✅ `GET /api/v1/products` | ✅ |
| Text search (`q=` param, full-text) | ✅ (param exists) | ✅ (query param) | ✅ |
| "In stock only" toggle | ⬜ | ⬜ | ⬜ |
| Filter by rating | ⬜ | ⬜ | ⬜ |

---

## 🛍️ Product Detail Page (`/product/$productId`)

| Feature | UI | BE | 🔗 |
|---------|----|----|-----|
| Image carousel with thumbnails + discount badge | ✅ | — | — |
| Loading skeleton | ✅ | — | — |
| Not-found / error state | ✅ | — | — |
| Brand name → `/brand/$brand` link | ✅ | — | — |
| Product name, pack qty label | ✅ | ✅ `GET /api/v1/products/{id}` | ✅ |
| Star rating + review count | ✅ (count hardcoded) | ⬜ reviews API | ⬜ |
| Price · MRP strikethrough · Discount % | ✅ | ✅ | ✅ |
| Breadcrumbs (desktop) + mobile back button | ✅ | — | — |
| Size selector (stock-aware) | ✅ | ✅ | ✅ |
| Quantity selector | ✅ | — | — |
| Add to cart button + OOS states | ✅ (toast only) | ⬜ cart API | ⬜ |
| About this product (rich text) | ✅ | ✅ | ✅ |
| Highlights bullet list | ✅ | ✅ | ✅ |
| Wishlist toggle | ✅ (local state) | ⬜ | ⬜ |
| Share (copy URL) | ✅ | — | — |
| Related products ("You may also like") | ✅ | ✅ `GET /api/v1/categories/{slug}/products` | ✅ |
| Delivery estimate ("10 min") | ⬜ | ⬜ | ⬜ |
| Sticky mobile add-to-cart bar | ⬜ | — | — |
| Native Web Share API | ⬜ | — | — |

---

## ⭐ Product Reviews Page (`/product/$productId/reviews`)

| Feature | UI | BE | 🔗 |
|---------|----|----|-----|
| Page route exists | ✅ | ⬜ | ⬜ |
| Review list with pagination | ⬜ | ⬜ | ⬜ |
| Rating breakdown histogram | ⬜ | ⬜ | ⬜ |
| "Write a review" form + photo upload | ⬜ | ⬜ | ⬜ |
| Helpful vote button | ⬜ | ⬜ | ⬜ |
| Filter reviews by star | ⬜ | ⬜ | ⬜ |

---

## 🏷️ Brand Directory (`/brand`)

| Feature | UI | BE | 🔗 |
|---------|----|----|-----|
| Page route + brand grid | ✅ | ✅ `GET /api/v1/brands` | ✅ |
| Brand search / filter | ⬜ | ⬜ | ⬜ |

---

## 🏷️ Brand Detail (`/brand/$brand`)

| Feature | UI | BE | 🔗 |
|---------|----|----|-----|
| Page route exists | ✅ | ✅ `GET /api/v1/brands/{slug}` | ⬜ |
| Brand hero (logo, name, description) | ⬜ | ✅ | ⬜ |
| Brand product listing | ⬜ | ✅ `GET /api/v1/products?brands=` | ⬜ |

---

## 🗂️ Collection Directory (`/collection`)

| Feature | UI | BE | 🔗 |
|---------|----|----|-----|
| Page route + CollectionCard | ✅ | ⬜ (static data) | ⬜ |
| Full grid listing | ✅ | ⬜ | ⬜ |

---

## 🗂️ Collection Detail (`/collection/$slug`)

| Feature | UI | BE | 🔗 |
|---------|----|----|-----|
| Page route exists | ✅ | ⬜ | ⬜ |
| Collection hero + curated product grid | ⬜ | ⬜ | ⬜ |

---

## 🎟️ Offers Page (`/offers`)

| Feature | UI | BE | 🔗 |
|---------|----|----|-----|
| Page route + OffersStrip | ✅ | ✅ coupons exist | ⬜ |
| Full coupon listing with copy-code | ⬜ | ✅ `GET /api/v1/coupons` (admin) | ⬜ |
| Eligibility status per coupon | ⬜ | ✅ `POST /api/v1/coupons/validate` | ⬜ |

---

## 🛒 Cart Page (`/cart`)

| Feature | UI | BE | 🔗 |
|---------|----|----|-----|
| Page route exists | ✅ | ⬜ | ⬜ |
| Line items (image · name · size · qty · remove) | ⬜ | ⬜ | ⬜ |
| Price summary (subtotal · GST · delivery · total) | ⬜ | ⬜ | ⬜ |
| Coupon input + apply/remove | ⬜ | ✅ `POST /api/v1/coupons/validate` | ⬜ |
| "Proceed to checkout" CTA | ⬜ | — | — |
| Empty cart state | ⬜ | — | — |

---

## ✅ Checkout Flow

| Feature | UI | BE | 🔗 |
|---------|----|----|-----|
| Delivery address step (`/checkout/address`) | ✅ page | ⬜ | ⬜ |
| Order review step (`/checkout/review`) | ✅ page | ⬜ | ⬜ |
| Payment step (`/checkout/payment`) | ✅ page | ⬜ | ⬜ |
| Address selection + add new inline | ⬜ | ⬜ | ⬜ |
| Order summary sidebar | ⬜ | ⬜ | ⬜ |
| Razorpay / UPI integration | ⬜ | ⬜ | ⬜ |
| COD option | ⬜ | ⬜ | ⬜ |
| Order confirmation + success redirect | ⬜ | ⬜ | ⬜ |

---

## 💳 Payment Status (`/payment/status`)

| Feature | UI | BE | 🔗 |
|---------|----|----|-----|
| Page route exists | ✅ | ⬜ | ⬜ |
| Success state (order id, ETA) | ⬜ | ⬜ | ⬜ |
| Failure state (retry / support) | ⬜ | ⬜ | ⬜ |

---

## 🔐 Auth (`/auth/login`)

| Feature | UI | BE | 🔗 |
|---------|----|----|-----|
| Auth layout with branding | ✅ | — | — |
| Email + password sign-in form | ⬜ | ✅ Better Auth `sign-in/email` | ⬜ |
| Sign-up form | ⬜ | ✅ Better Auth `sign-up/email` | ⬜ |
| OTP via phone number | ⬜ | ⬜ plugin not added yet | ⬜ |
| Google OAuth | ⬜ | ⬜ plugin not added yet | ⬜ |
| Forgot password / reset | ⬜ | ✅ Better Auth built-in | ⬜ |

---

## 👤 Account — Profile (`/profile/edit`)

| Feature | UI | BE | 🔗 |
|---------|----|----|-----|
| Edit profile page | ✅ | ⬜ `PATCH /api/v1/users/me` | ⬜ |
| Edit name, phone, email | ⬜ | ⬜ | ⬜ |
| Avatar upload (→ R2) | ⬜ | ⬜ | ⬜ |
| Baby profile (name, DOB) | ⬜ | ⬜ | ⬜ |

---

## 📦 Account — Orders

| Feature | UI | BE | 🔗 |
|---------|----|----|-----|
| Orders list (`/orders`) | ✅ | ⬜ `GET /api/v1/orders` | ⬜ |
| Order detail (`/orders/$orderId`) | ✅ | ⬜ `GET /api/v1/orders/{id}` | ⬜ |
| Order tracking (`/orders/$orderId/tracking`) | ✅ | ⬜ | ⬜ |
| Return initiation (`/orders/$orderId/return`) | ✅ | ⬜ | ⬜ |
| Write review (`/orders/$orderId/review`) | ✅ | ⬜ | ⬜ |
| Order help (`/orders/$orderId/help`) | ✅ | ⬜ | ⬜ |
| Download invoice | ⬜ | ⬜ | ⬜ |
| Reorder | ⬜ | ⬜ | ⬜ |

---

## ❤️ Account — Wishlist (`/wishlist`)

| Feature | UI | BE | 🔗 |
|---------|----|----|-----|
| Page route exists | ✅ | ⬜ `GET /api/v1/wishlist` | ⬜ |
| Product list | ⬜ | ⬜ | ⬜ |
| Remove / move to cart | ⬜ | ⬜ | ⬜ |

---

## 📍 Account — Addresses (`/addresses`)

| Feature | UI | BE | 🔗 |
|---------|----|----|-----|
| Page route exists | ✅ | ⬜ `GET /api/v1/addresses` | ⬜ |
| Saved addresses list | ⬜ | ⬜ | ⬜ |
| Add / edit / delete / set default | ⬜ | ⬜ | ⬜ |

---

## 🔔 Account — Notifications (`/notifications`)

| Feature | UI | BE | 🔗 |
|---------|----|----|-----|
| Page route exists | ✅ | ⬜ `GET /api/v1/notifications` | ⬜ |
| In-app list + mark read | ⬜ | ⬜ | ⬜ |
| Preferences page (`/profile/notifications`) | ✅ | ⬜ | ⬜ |

---

## 💳 Account — Payment Methods (`/profile/payment-methods`)

| Feature | UI | BE | 🔗 |
|---------|----|----|-----|
| Page route exists | ✅ | ⬜ | ⬜ |
| Saved UPI / cards list | ⬜ | ⬜ | ⬜ |

---

## 🔒 Account — Privacy (`/profile/privacy`)

| Feature | UI | BE | 🔗 |
|---------|----|----|-----|
| Page route exists | ✅ | ⬜ | ⬜ |
| Data download / GDPR delete | ⬜ | ⬜ | ⬜ |

---

## 🎁 Account — Referrals (`/referrals`)

| Feature | UI | BE | 🔗 |
|---------|----|----|-----|
| Page route exists | ✅ | ⬜ | ⬜ |
| Referral code + share | ⬜ | ⬜ | ⬜ |

---

## 🆘 Support (`/support`)

| Feature | UI | BE | 🔗 |
|---------|----|----|-----|
| Ticket list page | ✅ | ⬜ | ⬜ |
| Ticket detail (`/support/$ticketId`) | ✅ | ⬜ | ⬜ |
| Create ticket form | ⬜ | ⬜ | ⬜ |
| Chat / message thread | ⬜ | ⬜ | ⬜ |

---

## 📄 Static Pages

| Page | UI | BE |
|------|----|----|
| `/about` | ✅ | — |
| `/contact` | ✅ | — |
| `/help` | ✅ | — |
| `/legal/privacy` | ✅ | — |
| `/legal/terms` | ✅ | — |
| `/legal/shipping` | ✅ | — |
| `/legal/returns` | ✅ | — |

---

## 🌐 Shell / Global

| Feature | UI | BE | 🔗 |
|---------|----|----|-----|
| Store layout + protected layout guards | ✅ | ✅ Better Auth session | ✅ |
| Header (logo, nav, search icon) | ✅ | — | — |
| Header search → `/search?q=` | ✅ (`SearchBar` component) | ✅ | ✅ |
| Bottom nav bar (mobile) | ⬜ | — | — |
| Footer | ⬜ | — | — |
| Location picker | ⬜ (module exists) | ⬜ | ⬜ |
| PWA "Add to Home Screen" prompt | ⬜ | — | — |
| Offline / service worker fallback | ⬜ | — | — |

---

## 📊 Backend API Summary

### Platform API (`/api/v1/*`) — **built & mounted**

| Module | Endpoints |
|--------|-----------|
| Auth (Better Auth) | sign-in · sign-up · session · sign-out · forgot/reset password |
| Categories | `GET /categories` · `GET /categories/{slug}` |
| Brands | `GET /brands` · `GET /brands/{slug}` |
| Products | `GET /products` · `GET /products/{id}` · `GET /categories/{slug}/products` |
| Coupons | `POST /coupons/validate` |

### Admin API (`/api/v1/admin/*`) — **built & mounted**

| Module | What's there |
|--------|-------------|
| Auth | Staff sign-in / sign-out |
| Roles | Role list + permission check |
| Staff | CRUD for staff accounts |
| Brands | Full CRUD |
| Vendors | Full CRUD |
| Categories | Full CRUD + reorder |
| Products | Full CRUD |
| Hubs | CRUD (delivery hubs) |
| Inventory | Stock adjustments |
| Coupons | Full CRUD + validation engine |

### Not yet built on backend

`cart` · `addresses` · `orders` · `payments` · `reviews` · `wishlist` · `notifications` · `subscriptions` · `search` (full-text / Typesense) · `users/me` profile endpoints
