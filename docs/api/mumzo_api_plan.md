# Mumzo API Plan — Baby Products E-Commerce

> **Stack**: Hono (Bun) · Better Auth · Drizzle ORM · Postgres · Zod validation  
> **Base URL**: `/api/v1`  
> **Auth**: **Better Auth** — session-based (cookie, httpOnly, sameSite: none, secure). Admin routes require role check via Better Auth's `admin` plugin.

---

## API Groups Overview

| # | Group | Purpose |
|---|-------|---------|
| 1 | Auth | Sign up, sign in, OTP, sessions |
| 2 | Users & Profiles | Mom/baby profile, preferences |
| 3 | Categories | Browse all category groups |
| 4 | Products | Catalogue, detail, filters |
| 5 | Search | Full-text + filtered search |
| 6 | Cart | Server-side cart sync |
| 7 | Addresses | Saved delivery addresses |
| 8 | Coupons & Offers | Validate & list active coupons |
| 9 | Orders | Place, track, return, reorder |
| 10 | Payments | Initiate, verify, refunds |
| 11 | Reviews & Ratings | Product reviews |
| 12 | Wishlist | Save for later |
| 13 | Notifications | Push/in-app alerts |
| 14 | Subscriptions | Subscribe & forget (auto-delivery) |
| 15 | SuperAdmin | Manage all entities, analytics |

---

## 1. Auth (`/api/auth`)

> **Fully handled by Better Auth** — already wired in the server at `app.on([POST, GET], /api/auth/*)`.  
> Do NOT build these manually. Configure via plugins in [`packages/auth/src/index.ts`](file:///home/bikram/Desktop/Work/mumzo_app/packages/auth/src/index.ts).

### Current State
- ✅ `emailAndPassword` — enabled
- ✅ Drizzle adapter on Postgres (`user`, `session`, `account`, `verification` tables — already in [`schema/auth.ts`](file:///home/bikram/Desktop/Work/mumzo_app/packages/db/src/schema/auth.ts))
- ✅ Cookie-based sessions (httpOnly, sameSite: none, secure)
- ❌ Phone/OTP — not yet added
- ❌ Google OAuth — not yet added
- ❌ Admin role plugin — not yet added

### What to Add (Better Auth plugins)

```ts
// packages/auth/src/index.ts — plugins to add:
import { phoneNumber } from "better-auth/plugins";  // OTP via SMS
import { socialProviders } from "better-auth/plugins"; // Google OAuth
import { admin } from "better-auth/plugins";          // Role management
import { username } from "better-auth/plugins";       // Optional
```

### Auto-generated Endpoints (no manual code needed)

| Method | Path | Plugin | Description |
|--------|------|--------|-------------|
| `POST` | `/api/auth/sign-up/email` | core | Register with email + password |
| `POST` | `/api/auth/sign-in/email` | core | Login with email + password |
| `GET` | `/api/auth/session` | core | Get current session + user |
| `POST` | `/api/auth/sign-out` | core | Invalidate session |
| `POST` | `/api/auth/forgot-password` | core | Send password reset email |
| `POST` | `/api/auth/reset-password` | core | Reset password with token |
| `POST` | `/api/auth/verify-email` | core | Verify email address |
| `POST` | `/api/auth/sign-in/phone-number` | `phoneNumber` plugin | Send OTP to mobile |
| `POST` | `/api/auth/phone-number/verify` | `phoneNumber` plugin | Verify OTP |
| `POST` | `/api/auth/sign-in/social` | `socialProviders` plugin | Google OAuth redirect |
| `GET` | `/api/auth/callback/google` | `socialProviders` plugin | Google OAuth callback |
| `POST` | `/api/auth/admin/set-role` | `admin` plugin | Assign user role (superadmin only) |
| `POST` | `/api/auth/admin/ban-user` | `admin` plugin | Ban a user |
| `POST` | `/api/auth/admin/unban-user` | `admin` plugin | Unban a user |
| `GET` | `/api/auth/admin/list-users` | `admin` plugin | List all users |

### Schema Extensions Needed
Add extra columns to the `user` table (Better Auth supports this via `user.additionalFields`):

```ts
// Fields to add to the user table
phone: text("phone").unique(),          // mobile number
phoneVerified: boolean("phone_verified").default(false),
role: text("role").default("customer"), // customer | admin | superadmin
banned: boolean("banned").default(false),
bannedReason: text("banned_reason"),
```

### Frontend Client (platform app)
```ts
// packages/auth/src/client.ts  — already exists in apps/platform
import { createAuthClient } from "better-auth/react";
import { phoneNumberClient, adminClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  baseURL: import.meta.env.VITE_API_URL,
  plugins: [phoneNumberClient(), adminClient()],
});
```

---

## 2. Users & Profiles (`/api/v1/users`)

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/v1/users/me` | Get own profile (momName, babyName, babyAge, phone, email, avatar) |
| `PATCH` | `/api/v1/users/me` | Update own profile |
| `POST` | `/api/v1/users/me/avatar` | Upload profile picture |
| `DELETE` | `/api/v1/users/me` | Delete account (GDPR) |
| `GET` | `/api/v1/users/me/baby` | Get baby profile (name, age, milestones) |
| `PATCH` | `/api/v1/users/me/baby` | Update baby profile |
| `GET` | `/api/v1/users/me/stats` | Orders count, wishlist count, cart count |

---

## 3. Categories (`/api/v1/categories`)

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/v1/categories` | List all categories (slug, name, tagline, img, color, brands) |
| `GET` | `/api/v1/categories/:slug` | Single category detail |
| `GET` | `/api/v1/categories/:slug/brands` | All brands available in category |
| `GET` | `/api/v1/categories/:slug/sizes` | Available sizes in category |

> **Deviation from the original plan:** brands also get their own top-level,
> first-class endpoints — `GET /api/v1/brands` (active brands, public fields:
> `slug`, `name`, `logoUrl`, `productCount` — internal `id` dropped) and
> `GET /api/v1/brands/:slug` (single brand by its real DB slug). These are
> distinct from `/api/v1/categories/:slug/brands` above, which stays a
> category-scoped filter facet (brand *names* only, for the category filter
> panel). The standalone endpoints exist because the storefront has its own
> brand directory/detail pages and the admin models `Brand` as a real entity
> (with a logo) independent of any category — see
> `apps/server/src/modules/platform/v1/brands/`. A later pass may add
> `GET /api/v1/brands/:slug/products` for the brand detail page's product
> listing; not built yet.

---

## 4. Products (`/api/v1/products`)

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/v1/products` | Paginated product list |
| `GET` | `/api/v1/products/:id` | Single product detail |
| `GET` | `/api/v1/categories/:slug/products` | Products in a category with filters |
| `GET` | `/api/v1/products/featured` | Featured / bestsellers |
| `GET` | `/api/v1/products/new-arrivals` | Recently added products |
| `GET` | `/api/v1/products/:id/related` | Related / similar products |

**Query params for listing** (category listing & global):
- `sort` → `relevance | price_asc | price_desc | discount | rating`
- `brands` → comma-separated brand names
- `minPrice`, `maxPrice`
- `sizes` → comma-separated size values
- `inStock` → `true | false`
- `page`, `limit`

---

## 5. Search (`/api/v1/search`)

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/v1/search?q=cerelac` | Full-text search across products & categories |
| `GET` | `/api/v1/search/suggestions?q=pa` | Autocomplete suggestions |
| `GET` | `/api/v1/search/trending` | Trending search terms |
| `GET` | `/api/v1/search/recent` | User's recent searches (auth required) |
| `DELETE` | `/api/v1/search/recent` | Clear recent searches |

---

## 6. Cart (`/api/v1/cart`)

> Server-side cart for cross-device sync. Guest carts merged on login.

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/v1/cart` | Get cart (items, totals, applied coupon) |
| `POST` | `/api/v1/cart/items` | Add item `{ productId, qty, size? }` |
| `PATCH` | `/api/v1/cart/items/:itemId` | Update qty |
| `DELETE` | `/api/v1/cart/items/:itemId` | Remove item |
| `DELETE` | `/api/v1/cart` | Clear entire cart |
| `POST` | `/api/v1/cart/coupon` | Apply coupon `{ code }` → returns updated totals |
| `DELETE` | `/api/v1/cart/coupon` | Remove applied coupon |
| `GET` | `/api/v1/cart/totals` | Recalculate: subtotal, discount, GST, delivery, total |
| `POST` | `/api/v1/cart/merge` | Merge guest cart into logged-in cart |

---

## 7. Addresses (`/api/v1/addresses`)

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/v1/addresses` | List all saved addresses |
| `POST` | `/api/v1/addresses` | Add new address |
| `GET` | `/api/v1/addresses/:id` | Get single address |
| `PATCH` | `/api/v1/addresses/:id` | Update address |
| `DELETE` | `/api/v1/addresses/:id` | Delete address |
| `PATCH` | `/api/v1/addresses/:id/default` | Set as default delivery address |

**Address fields**: `label (Home/Work)`, `line1`, `line2`, `city`, `state`, `pincode`, `isDefault`

---

## 8. Coupons & Offers (`/api/v1/coupons`)

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/v1/coupons` | List all active / user-eligible coupons |
| `POST` | `/api/v1/coupons/validate` | Validate `{ code, cartTotal, categorySlug? }` → returns discount |
| `GET` | `/api/v1/coupons/user` | Coupons claimed by the user |

---

## 9. Orders (`/api/v1/orders`)

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/v1/orders` | List user's orders (paginated) |
| `POST` | `/api/v1/orders` | Place an order `{ addressId, paymentMethod, couponCode? }` |
| `GET` | `/api/v1/orders/:id` | Order detail (items, status, tracking, invoice) |
| `GET` | `/api/v1/orders/:id/tracking` | Live delivery tracking |
| `POST` | `/api/v1/orders/:id/cancel` | Cancel order (if cancellable) |
| `POST` | `/api/v1/orders/:id/return` | Initiate return request |
| `POST` | `/api/v1/orders/:id/reorder` | Re-add all items to cart |
| `GET` | `/api/v1/orders/:id/invoice` | Download invoice PDF |

**Order statuses**: `pending_payment → confirmed → packed → shipped → out_for_delivery → delivered → cancelled → return_requested → returned`

---

## 10. Payments (`/api/v1/payments`)

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/v1/payments/initiate` | Initiate payment `{ orderId, method }` → returns gateway payload |
| `POST` | `/api/v1/payments/verify` | Verify payment signature (Razorpay webhook style) |
| `GET` | `/api/v1/payments/:paymentId` | Payment details + status |
| `POST` | `/api/v1/payments/:paymentId/refund` | Initiate refund (on cancellation/return) |
| `GET` | `/api/v1/payments/:paymentId/refund` | Refund status |

**Payment methods**: `razorpay | upi | cod | card | netbanking | wallet`

---

## 11. Reviews & Ratings (`/api/v1/products/:id/reviews`)

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/v1/products/:id/reviews` | List reviews (paginated, sortable) |
| `POST` | `/api/v1/products/:id/reviews` | Add review `{ rating, title, body, images? }` |
| `PATCH` | `/api/v1/products/:id/reviews/:reviewId` | Edit own review |
| `DELETE` | `/api/v1/products/:id/reviews/:reviewId` | Delete own review |
| `POST` | `/api/v1/products/:id/reviews/:reviewId/helpful` | Mark review as helpful |

---

## 12. Wishlist (`/api/v1/wishlist`)

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/v1/wishlist` | Get all wishlisted products |
| `POST` | `/api/v1/wishlist` | Add product `{ productId }` |
| `DELETE` | `/api/v1/wishlist/:productId` | Remove from wishlist |
| `POST` | `/api/v1/wishlist/move-to-cart` | Move wishlist item to cart `{ productId, qty, size? }` |

---

## 13. Notifications (`/api/v1/notifications`)

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/v1/notifications` | List in-app notifications |
| `PATCH` | `/api/v1/notifications/:id/read` | Mark as read |
| `PATCH` | `/api/v1/notifications/read-all` | Mark all as read |
| `POST` | `/api/v1/notifications/push-token` | Register FCM/APNs push token |
| `DELETE` | `/api/v1/notifications/push-token` | Unregister push token |
| `GET` | `/api/v1/notifications/preferences` | Get notification preferences |
| `PATCH` | `/api/v1/notifications/preferences` | Update preferences (order updates, offers, etc.) |

---

## 14. Subscriptions — "Subscribe & Forget" (`/api/v1/subscriptions`)

> Auto-delivery of repeat essentials (diapers, wipes, formula, etc.)

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/v1/subscriptions` | List all active subscriptions |
| `POST` | `/api/v1/subscriptions` | Create subscription `{ productId, qty, size?, frequency, startDate, addressId }` |
| `GET` | `/api/v1/subscriptions/:id` | Subscription detail + upcoming deliveries |
| `PATCH` | `/api/v1/subscriptions/:id` | Edit (qty, frequency, next delivery date) |
| `POST` | `/api/v1/subscriptions/:id/pause` | Pause subscription |
| `POST` | `/api/v1/subscriptions/:id/resume` | Resume subscription |
| `DELETE` | `/api/v1/subscriptions/:id` | Cancel subscription |
| `GET` | `/api/v1/subscriptions/:id/history` | Past deliveries & invoices |

**Frequencies**: `weekly | biweekly | monthly | every_2_months`

---

---

## 15. SuperAdmin APIs (`/api/v1/admin`)

> All routes require `role: superadmin | admin`. Uses role-based access.

### 15a. Dashboard & Analytics

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/v1/admin/dashboard` | Overview: GMV, orders today, new users, revenue chart |
| `GET` | `/api/v1/admin/analytics/revenue` | Revenue by day/week/month with filters |
| `GET` | `/api/v1/admin/analytics/orders` | Order funnel, cancellation rates, avg order value |
| `GET` | `/api/v1/admin/analytics/products` | Top-selling products, low-stock alerts |
| `GET` | `/api/v1/admin/analytics/users` | New signups, retention, cohort data |
| `GET` | `/api/v1/admin/analytics/categories` | Revenue & sales split by category |

### 15b. Product Management

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/v1/admin/products` | List all products (with filters, pagination) |
| `POST` | `/api/v1/admin/products` | Create new product |
| `GET` | `/api/v1/admin/products/:id` | Get product detail |
| `PATCH` | `/api/v1/admin/products/:id` | Update product (price, stock, description, images) |
| `DELETE` | `/api/v1/admin/products/:id` | Soft-delete product |
| `POST` | `/api/v1/admin/products/:id/images` | Upload product images |
| `DELETE` | `/api/v1/admin/products/:id/images/:imgId` | Delete a product image |
| `PATCH` | `/api/v1/admin/products/:id/stock` | Update stock quantity |
| `POST` | `/api/v1/admin/products/bulk` | Bulk import via CSV |

**Product fields**: `name, brand, categorySlug, price, mrp, description, about, highlights, images[], sizes[], qty (pack size), weight, stock, isActive, isBestseller, tags[]`

### 15c. Category Management

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/v1/admin/categories` | List all categories |
| `POST` | `/api/v1/admin/categories` | Create category |
| `PATCH` | `/api/v1/admin/categories/:slug` | Update category (name, image, tagline, color, brands) |
| `DELETE` | `/api/v1/admin/categories/:slug` | Soft-delete category |
| `PATCH` | `/api/v1/admin/categories/reorder` | Reorder categories `{ order: [slug1, slug2, ...] }` |

### 15d. Order Management

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/v1/admin/orders` | All orders (filterable by status, date, user) |
| `GET` | `/api/v1/admin/orders/:id` | Order detail |
| `PATCH` | `/api/v1/admin/orders/:id/status` | Update order status |
| `POST` | `/api/v1/admin/orders/:id/assign-delivery` | Assign delivery partner + tracking ID |
| `POST` | `/api/v1/admin/orders/:id/cancel` | Admin cancel (with reason) |
| `POST` | `/api/v1/admin/orders/:id/refund` | Process refund |
| `GET` | `/api/v1/admin/orders/exports` | Export orders CSV for date range |

### 15e. User Management

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/v1/admin/users` | List all users (search by name/email/phone) |
| `GET` | `/api/v1/admin/users/:id` | User detail + order history |
| `PATCH` | `/api/v1/admin/users/:id` | Update user info or role |
| `POST` | `/api/v1/admin/users/:id/ban` | Ban user account |
| `POST` | `/api/v1/admin/users/:id/unban` | Restore user access |
| `DELETE` | `/api/v1/admin/users/:id` | Hard delete user (GDPR) |

### 15f. Coupon & Offers Management

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/v1/admin/coupons` | List all coupons |
| `POST` | `/api/v1/admin/coupons` | Create coupon |
| `PATCH` | `/api/v1/admin/coupons/:id` | Update coupon |
| `DELETE` | `/api/v1/admin/coupons/:id` | Deactivate coupon |
| `GET` | `/api/v1/admin/coupons/:id/usage` | Usage stats for a coupon |

**Coupon fields**: `code, type (flat/pct), value, minAmt, cap, categorySlug, expiresAt, maxUses, isActive, firstOrderOnly`

### 15g. Review Moderation

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/v1/admin/reviews` | All reviews (filter by status: pending/approved/rejected) |
| `PATCH` | `/api/v1/admin/reviews/:id/approve` | Approve review |
| `PATCH` | `/api/v1/admin/reviews/:id/reject` | Reject review (with reason) |
| `DELETE` | `/api/v1/admin/reviews/:id` | Hard delete review |

### 15h. Subscription Management

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/v1/admin/subscriptions` | All subscriptions |
| `GET` | `/api/v1/admin/subscriptions/upcoming` | Upcoming deliveries in next 7 days |
| `PATCH` | `/api/v1/admin/subscriptions/:id` | Edit/override subscription |
| `POST` | `/api/v1/admin/subscriptions/:id/trigger` | Manually trigger a delivery |

### 15i. Payment & Refund Management

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/v1/admin/payments` | List all payments |
| `GET` | `/api/v1/admin/payments/:id` | Payment detail |
| `POST` | `/api/v1/admin/payments/:id/refund` | Process manual refund |
| `GET` | `/api/v1/admin/payments/failed` | Failed / pending payments |

### 15j. Notifications & Broadcasts

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/v1/admin/notifications/broadcast` | Send push/in-app to all users or segment |
| `GET` | `/api/v1/admin/notifications/broadcasts` | List past broadcasts |
| `POST` | `/api/v1/admin/notifications/test` | Send test notification to self |

### 15k. Admin User Management (SuperAdmin only)

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/v1/admin/staff` | List all admin staff accounts |
| `POST` | `/api/v1/admin/staff` | Create new admin account |
| `PATCH` | `/api/v1/admin/staff/:id` | Update role / permissions |
| `DELETE` | `/api/v1/admin/staff/:id` | Revoke admin access |

**Roles**: `superadmin | admin | catalog_manager | support | finance`

---

## Common Patterns

### Pagination
All list endpoints support:
```
?page=1&limit=20
```
Response:
```json
{ "data": [...], "meta": { "page": 1, "limit": 20, "total": 150, "hasNext": true } }
```

### Standard Response Envelope
```json
{ "success": true, "data": {}, "message": "OK" }
{ "success": false, "error": { "code": "INVALID_COUPON", "message": "..." } }
```

### Error Codes to Handle
| Code | Meaning |
|------|---------|
| `PRODUCT_OUT_OF_STOCK` | Item no longer available |
| `COUPON_EXPIRED` | Coupon validity lapsed |
| `COUPON_INVALID` | Code doesn't exist |
| `COUPON_MIN_AMOUNT` | Cart below minimum required |
| `ORDER_NOT_CANCELLABLE` | Past cancellation window |
| `PAYMENT_FAILED` | Gateway returned failure |
| `UNAUTHORIZED` | Token missing / invalid |
| `FORBIDDEN` | Insufficient role |

---

## Priority Order for Development

```
Phase 1 (MVP)
  ✅ Auth (Better Auth — already set up)
  🔲 Categories + Products (read-only)
  🔲 Cart
  🔲 Addresses
  🔲 Coupons (validate)
  🔲 Orders (place + list + detail)
  🔲 Payments (Razorpay)

Phase 2
  🔲 Search (pg full-text or Typesense)
  🔲 Reviews & Ratings
  🔲 Wishlist
  🔲 Notifications
  🔲 User Profile + Baby Profile

Phase 3
  🔲 Subscriptions (Subscribe & Forget)
  🔲 Admin — Product / Category / Order / User management
  🔲 Admin — Analytics Dashboard
  🔲 Admin — Coupon Management
  🔲 Admin — Broadcast Notifications
  🔲 Admin — Staff management (SuperAdmin)
```
