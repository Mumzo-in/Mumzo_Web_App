# Mumzo Admin Panel — Feature Checklist

> **Legend:**  
> `UI` ✅ = component/page built · `BE` ✅ = API endpoint implemented · `🔗` ✅ = frontend wired to real API (not mock data)  
> `⬜` = not yet built · Rendering unverified.

---

## 🏠 Dashboard (`/`)

| Feature | UI | BE | 🔗 |
|---------|----|----|-----|
| Dashboard page (KPI cards, charts) | ✅ | ⬜ | ⬜ |
| GMV · orders today · new users cards | ✅ (mock) | ⬜ | ⬜ |
| Revenue chart (day/week/month) | ✅ (mock) | ⬜ | ⬜ |
| Quick-action shortcuts | ✅ | — | — |
| Recent orders feed | ✅ (mock) | ⬜ | ⬜ |
| Low-stock alerts panel | ✅ (mock) | ⬜ | ⬜ |

---

## 📊 Overview / Analytics

| Feature | UI | BE | 🔗 |
|---------|----|----|-----|
| Analytics overview (`/overview/analytics`) | ✅ page | ⬜ | ⬜ |
| Business intelligence (`/overview/bi`) | ✅ page | ⬜ | ⬜ |
| Ops metrics (`/overview/ops`) | ✅ page | ⬜ | ⬜ |
| Revenue by period | ⬜ | ⬜ | ⬜ |
| Order funnel + cancellation rate | ⬜ | ⬜ | ⬜ |
| Top-selling products | ⬜ | ⬜ | ⬜ |
| New signups + retention cohorts | ⬜ | ⬜ | ⬜ |
| Category revenue split | ⬜ | ⬜ | ⬜ |

---

## 📦 Catalog — Products

| Feature | UI | BE | 🔗 |
|---------|----|----|-----|
| Products list (`/catalog/products`) | ✅ | ✅ `GET /admin/products` | ✅ |
| Pagination, search, filter by status | ✅ | ✅ | ✅ |
| Product table with sort | ✅ | ✅ | ✅ |
| Create product (`/catalog/products/new`) | ✅ | ✅ `POST /admin/products` | ✅ |
| Full product form (name · brand · category · price · MRP · stock · sizes · highlights · about · images) | ✅ | ✅ | ✅ |
| Rich-text "about" editor | ✅ | ✅ | ✅ |
| Size variants editor | ✅ | ✅ | ✅ |
| Product detail (`/catalog/products/$productId`) | ✅ | ✅ `GET /admin/products/{id}` | ✅ |
| Edit product (`/catalog/products/$productId/edit`) | ✅ | ✅ `PUT /admin/products/{id}` | ✅ |
| Image management (`/catalog/products/$productId/images`) | ✅ page | ⬜ (awaits R2) | ⬜ |
| Stock management (`/catalog/products/$productId/stock`) | ✅ page | ✅ `PATCH /admin/inventory` | ⬜ |
| Bulk import CSV (`/catalog/products/bulk`) | ✅ page | ⬜ | ⬜ |
| Soft-delete product | ✅ | ✅ `DELETE /admin/products/{id}` | ✅ |

---

## 🗂️ Catalog — Categories

| Feature | UI | BE | 🔗 |
|---------|----|----|-----|
| Categories list (`/catalog/categories`) | ✅ | ✅ `GET /admin/categories` | ✅ |
| Product count per category | ✅ | ✅ | ✅ |
| Drag-to-reorder | ✅ | ✅ `PUT /admin/categories/reorder` | ✅ |
| Create category (`/catalog/categories/new`) | ✅ page | ✅ `POST /admin/categories` | ⬜ |
| Edit category (`/catalog/categories/$slug`) | ✅ page | ✅ `PATCH /admin/categories/{slug}` | ⬜ |
| Category image upload | ⬜ | ⬜ (awaits R2) | ⬜ |
| Assign brands to category | ✅ | ✅ | ⬜ |
| Soft-delete category | ✅ | ✅ | ✅ |

---

## 🏷️ Catalog — Brands

| Feature | UI | BE | 🔗 |
|---------|----|----|-----|
| Brands list (`/catalog/brands`) | ✅ | ✅ `GET /admin/brands` | ✅ |
| Create brand | ✅ | ✅ `POST /admin/brands` | ✅ |
| Edit brand | ✅ | ✅ `PATCH /admin/brands/{slug}` | ✅ |
| Brand logo upload | ⬜ | ⬜ (awaits R2) | ⬜ |
| Delete brand | ✅ | ✅ | ✅ |

---

## 🏭 Catalog — Vendors

| Feature | UI | BE | 🔗 |
|---------|----|----|-----|
| Vendors list (`/catalog/vendors`) | ✅ | ✅ `GET /admin/vendors` | ✅ |
| Create vendor (`/catalog/vendors/new`) | ✅ | ✅ `POST /admin/vendors` | ✅ |
| Vendor detail (`/catalog/vendors/$vendorId`) | ✅ | ✅ `GET /admin/vendors/{id}` | ✅ |
| Edit vendor | ✅ | ✅ `PUT /admin/vendors/{id}` | ✅ |
| Deactivate vendor | ✅ | ✅ | ✅ |

---

## 🏪 Catalog — Hubs (Delivery Hubs)

| Feature | UI | BE | 🔗 |
|---------|----|----|-----|
| Hubs list page (`/catalog/hubs`) | ✅ page | ✅ `GET /admin/hubs` | ✅ |
| Create / edit hub | ✅ | ✅ `POST /admin/hubs` | ✅ |
| Hub detail (capacity, location) | ✅ | ✅ | ✅ |
| Deactivate hub | ✅ | ✅ | ✅ |

---

## 📦 Catalog — Inventory

| Feature | UI | BE | 🔗 |
|---------|----|----|-----|
| Inventory overview (`/catalog/inventory`) | ✅ page | ✅ `GET /admin/inventory` | ⬜ |
| Stock adjustments (`/catalog/inventory/adjustments`) | ✅ page | ✅ `PATCH /admin/inventory` | ⬜ |
| Batch tracking (`/catalog/inventory/batches`) | ✅ page | ⬜ | ⬜ |
| Low-stock alert list | ⬜ | ⬜ | ⬜ |

---

## 🗂️ Catalog — Other

| Feature | UI | BE | 🔗 |
|---------|----|----|-----|
| Collections management (`/catalog/collections`) | ✅ page | ⬜ | ⬜ |
| Merchandising / homepage ordering (`/catalog/merchandising`) | ✅ page | ⬜ | ⬜ |
| Pricing rules (`/catalog/pricing`) | ✅ page | ⬜ | ⬜ |

---

## 📋 Operations — Orders

| Feature | UI | BE | 🔗 |
|---------|----|----|-----|
| Orders list (`/operations/orders`) | ✅ | ⬜ `GET /admin/orders` | ⬜ (mock) |
| Filter by status / date / hub | ✅ | ⬜ | ⬜ |
| Order detail (`/operations/orders/$orderId`) | ✅ | ⬜ `GET /admin/orders/{id}` | ⬜ (mock) |
| Update order status | ✅ | ⬜ `PATCH /admin/orders/{id}/status` | ⬜ |
| Assign delivery partner + tracking | ⬜ | ⬜ | ⬜ |
| Admin cancel order (with reason) | ✅ | ⬜ | ⬜ |
| Process refund from order | ✅ | ⬜ | ⬜ |
| Export orders CSV | ⬜ | ⬜ | ⬜ |

---

## 🛵 Operations — Riders

| Feature | UI | BE | 🔗 |
|---------|----|----|-----|
| Riders list (`/operations/riders`) | ✅ page | ⬜ | ⬜ |
| Rider detail (`/operations/riders/$riderId`) | ✅ page | ⬜ | ⬜ |
| Assign rider to order | ⬜ | ⬜ | ⬜ |
| Rider availability / live location | ⬜ | ⬜ | ⬜ |

---

## 🚚 Operations — Dispatch

| Feature | UI | BE | 🔗 |
|---------|----|----|-----|
| Dispatch board (`/operations/dispatch`) | ✅ page | ⬜ | ⬜ |
| Live order map | ⬜ | ⬜ | ⬜ |

---

## ↩️ Operations — Returns

| Feature | UI | BE | 🔗 |
|---------|----|----|-----|
| Returns list (`/operations/returns`) | ✅ page | ⬜ | ⬜ |
| Approve / reject return | ⬜ | ⬜ | ⬜ |
| Process refund on return | ⬜ | ⬜ | ⬜ |

---

## 🎧 Operations — Support Tickets

| Feature | UI | BE | 🔗 |
|---------|----|----|-----|
| Tickets list (`/operations/tickets`) | ✅ page | ⬜ | ⬜ |
| Ticket detail (`/operations/tickets/$ticketId`) | ✅ page | ⬜ | ⬜ |
| Reply to ticket | ⬜ | ⬜ | ⬜ |
| Resolve / escalate | ⬜ | ⬜ | ⬜ |

---

## 👥 Customers — Users

| Feature | UI | BE | 🔗 |
|---------|----|----|-----|
| Users list (`/customers/users`) | ✅ | ⬜ `GET /admin/users` | ⬜ (mock) |
| Search by name / email / phone | ✅ | ⬜ | ⬜ |
| User detail (`/customers/users/$userId`) | ✅ | ⬜ `GET /admin/users/{id}` | ⬜ (mock) |
| Order history in user detail | ✅ (mock) | ⬜ | ⬜ |
| Ban / unban user | ✅ | ⬜ | ⬜ |
| Delete user (GDPR) | ✅ | ⬜ | ⬜ |
| Update user info / role | ✅ | ⬜ | ⬜ |

---

## 👥 Customers — Reviews

| Feature | UI | BE | 🔗 |
|---------|----|----|-----|
| Reviews moderation list (`/customers/reviews`) | ✅ page | ⬜ | ⬜ |
| Filter by status (pending / approved / rejected) | ⬜ | ⬜ | ⬜ |
| Approve / reject review | ⬜ | ⬜ | ⬜ |
| Delete review | ⬜ | ⬜ | ⬜ |

---

## 👥 Customers — Segments & Journeys

| Feature | UI | BE | 🔗 |
|---------|----|----|-----|
| Segments page (`/customers/segments`) | ✅ page | ⬜ | ⬜ |
| Customer journeys (`/customers/journeys`) | ✅ page | ⬜ | ⬜ |
| Referrals overview (`/customers/referrals`) | ✅ page | ⬜ | ⬜ |

---

## 📣 Customers — Broadcasts

| Feature | UI | BE | 🔗 |
|---------|----|----|-----|
| Broadcasts list (`/customers/broadcasts`) | ✅ page | ⬜ | ⬜ |
| New broadcast (`/customers/broadcasts/new`) | ✅ page | ⬜ | ⬜ |
| Send push/in-app to all / segment | ⬜ | ⬜ | ⬜ |
| Broadcast history | ⬜ | ⬜ | ⬜ |

---

## 💰 Finance — Coupons

| Feature | UI | BE | 🔗 |
|---------|----|----|-----|
| Coupons list (`/finance/coupons`) | ✅ | ✅ `GET /admin/coupons` | ✅ |
| Create coupon (`/finance/coupons/new`) | ✅ | ✅ `POST /admin/coupons` | ✅ |
| Coupon detail (`/finance/coupons/$couponId`) | ✅ | ✅ `GET /admin/coupons/{id}` | ✅ |
| Edit coupon (`/finance/coupons/$couponId/edit`) | ✅ | ✅ `PATCH /admin/coupons/{id}` | ✅ |
| Deactivate coupon | ✅ | ✅ `DELETE /admin/coupons/{id}` | ✅ |
| Usage stats per coupon | ✅ (mock) | ⬜ | ⬜ |
| Validate coupon (test tool) | ✅ | ✅ `POST /coupons/validate` | ✅ |

---

## 💰 Finance — Payments

| Feature | UI | BE | 🔗 |
|---------|----|----|-----|
| Payments list (`/finance/payments`) | ✅ | ⬜ `GET /admin/payments` | ⬜ (mock) |
| Payment detail (`/finance/payments/$paymentId`) | ✅ | ⬜ | ⬜ (mock) |
| Failed / pending payments (`/finance/payments/failed`) | ✅ | ⬜ | ⬜ (mock) |
| Manual refund | ✅ | ⬜ `POST /admin/payments/{id}/refund` | ⬜ |

---

## 💰 Finance — Subscriptions

| Feature | UI | BE | 🔗 |
|---------|----|----|-----|
| All subscriptions (`/finance/subscriptions`) | ✅ page | ⬜ | ⬜ |
| Upcoming deliveries (`/finance/subscriptions/upcoming`) | ✅ page | ⬜ | ⬜ |
| Edit / pause / cancel subscription | ⬜ | ⬜ | ⬜ |
| Manually trigger delivery | ⬜ | ⬜ | ⬜ |

---

## 💰 Finance — Other

| Feature | UI | BE | 🔗 |
|---------|----|----|-----|
| Campaigns (`/finance/campaigns`) | ✅ page | ⬜ | ⬜ |
| Tax management (`/finance/tax`) | ✅ page | ⬜ | ⬜ |
| Reconciliation (`/finance/reconciliation`) | ✅ page | ⬜ | ⬜ |

---

## 🖥️ Platform / CMS

| Feature | UI | BE | 🔗 |
|---------|----|----|-----|
| Feature flags (`/platform/flags`) | ✅ page | ⬜ | ⬜ |
| Experiments / A/B (`/platform/experiments`) | ✅ page | ⬜ | ⬜ |
| Integrations (`/platform/integrations`) | ✅ page | ⬜ | ⬜ |
| System health (`/platform/system`) | ✅ page | ⬜ | ⬜ |
| Legal banners (`/legal/banners`) | ✅ page | ⬜ | ⬜ |
| Legal config (`/legal/config`) | ✅ page | ⬜ | ⬜ |
| Legal pages editor (`/legal/pages`) | ✅ page | ⬜ | ⬜ |

---

## 👤 Staff Management

| Feature | UI | BE | 🔗 |
|---------|----|----|-----|
| Staff list with roles (`/staff`) | ✅ | ✅ Better Auth `admin.listUsers` | ✅ |
| Invite / create staff account | ✅ | ✅ Better Auth `admin.createUser` | ✅ |
| Edit staff role / permissions | ✅ | ✅ Better Auth `admin.setRole` | ✅ |
| Ban staff | ✅ | ✅ `POST /admin/staff/{id}/ban` | ✅ |
| Unban staff | ✅ | ✅ `POST /admin/staff/{id}/unban` | ✅ |
| Delete / revoke staff access | ✅ | ✅ `DELETE /admin/staff/{id}` | ✅ |
| Audit log (`/staff/audit-log`) | ✅ page | ⬜ | ⬜ |

---

## 🔑 Roles & Permissions

| Feature | UI | BE | 🔗 |
|---------|----|----|-----|
| Roles matrix page (`/roles`) | ✅ | ✅ `GET /admin/roles` | ✅ |
| Permission check per resource+action | ✅ | ✅ | ✅ |
| Create / edit custom role | ⬜ | ⬜ | ⬜ |

---

## ⚙️ Settings

| Feature | UI | BE | 🔗 |
|---------|----|----|-----|
| My profile (`/settings/profile`) | ✅ | ✅ Better Auth session | ✅ |
| Edit name / avatar | ✅ | ⬜ (awaits R2) | ⬜ |
| Change password | ✅ | ✅ Better Auth | ⬜ |
| 2FA / MFA setup | ⬜ | ⬜ | ⬜ |

---

## 🔐 Auth (`/auth/login`)

| Feature | UI | BE | 🔗 |
|---------|----|----|-----|
| Staff sign-in form | ✅ | ✅ `POST /admin/auth/sign-in` | ✅ |
| Sign-out | ✅ | ✅ `POST /admin/auth/sign-out` | ✅ |
| Forbidden page (`/forbidden`) | ✅ | — | — |
| Password reset | ⬜ | ✅ Better Auth | ⬜ |

---

## 🌐 Shell / Layout

| Feature | UI | BE | 🔗 |
|---------|----|----|-----|
| Admin layout + sidebar nav | ✅ | — | — |
| Role-gated sidebar sections | ✅ | ✅ | ✅ |
| Breadcrumbs | ✅ | — | — |
| Global search (command palette) | ⬜ | ⬜ | ⬜ |
| Dark mode toggle | ✅ | — | — |
| Notification bell | ⬜ | ⬜ | ⬜ |

---

## 📊 Summary

| Section | UI pages | BE ready | 🔗 Wired |
|---------|----------|----------|---------|
| Dashboard | ✅ | ⬜ | ⬜ |
| Products | ✅ full | ✅ full CRUD | ✅ full |
| Categories | ✅ full | ✅ full CRUD | ✅ list/delete · ⬜ create/edit UI |
| Brands | ✅ | ✅ full CRUD | ✅ |
| Vendors | ✅ | ✅ full CRUD | ✅ |
| Hubs | ✅ | ✅ CRUD | ✅ |
| Inventory | ✅ | ✅ | ⬜ |
| Orders | ✅ pages | ⬜ | ⬜ (mock) |
| Riders / Dispatch | ✅ pages | ⬜ | ⬜ |
| Returns | ✅ page | ⬜ | ⬜ |
| Support Tickets | ✅ pages | ⬜ | ⬜ |
| Users | ✅ pages | ⬜ | ⬜ (mock) |
| Coupons | ✅ full | ✅ full CRUD | ✅ |
| Payments | ✅ pages | ⬜ | ⬜ (mock) |
| Subscriptions | ✅ pages | ⬜ | ⬜ |
| Staff | ✅ | ✅ Better Auth | ✅ |
| Roles | ✅ | ✅ | ✅ |
| Auth | ✅ | ✅ | ✅ |
| Settings / CMS / Platform | ✅ pages | ⬜ | ⬜ |
