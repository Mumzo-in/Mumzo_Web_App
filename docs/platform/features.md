# Mumzo — Platform (Customer App) Feature Roadmap

The full feature catalogue for the **mom-facing storefront** (`apps/platform`) — a quick-commerce
PWA for moms & babies (10-minute delivery, launching in Hyderabad). This is a **living roadmap**,
not a build order; phases guide sequencing.

**Related:** [pages-spec.md](./pages-spec.md) · [design-system.md](./design-system.md) ·
[superadmin/features.md](../superadmin/features.md) · [api plan](../api/mumzo_api_plan.md)

### How to read this

- **Phase** — `P1` MVP · `P2` Growth · `P3` Scale · `Vision` (aspirational).
- **Priority** — `P0` must-have · `P1` important · `P2` nice-to-have.
- **Ref** — the backing API group in the [api plan](../api/mumzo_api_plan.md) (§) and/or the
  [route](./pages-spec.md).

---

## 1. Onboarding & Auth · <sub>§1 Auth · §2 Users</sub>

| Feature | Description | Phase | Priority |
|---|---|---|---|
| Email + password | Sign up / sign in (Better Auth) | P1 | P0 |
| Phone OTP login | SMS OTP via MSG91 (DLT-registered) | P1 | P0 |
| Google OAuth | One-tap social sign-in | P2 | P1 |
| Guest browsing | Browse & build cart before auth | P1 | P0 |
| Pincode / serviceability gate | Check delivery availability before shopping | P1 | P0 |
| First-run onboarding | Capture mom name + baby name/age for personalization | P2 | P1 |
| Forgot / reset password | Email reset flow | P1 | P0 |
| Email verification | Verify address post-signup | P1 | P1 |
| Session management | Multi-device sessions, sign-out everywhere | P2 | P1 |
| Account deletion (GDPR) | Self-serve delete + data export | P2 | P1 |

## 2. Home & Discovery · <sub>§3 Categories · §4 Products</sub>

| Feature | Description | Phase | Priority |
|---|---|---|---|
| Category shelves | "Shop by category" grid | P1 | P0 |
| Hero / promo banners | Merchandised banners (CMS-driven) | P1 | P1 |
| Featured / bestsellers | "Loved by mumzos" rail | P1 | P0 |
| New arrivals | Recently added products | P2 | P1 |
| Personalized home | Ranked by history + baby age | P3 | P1 |
| Age-based recommendations | Products matched to baby's milestone | P3 | P1 |
| Recently viewed | Quick return to browsed items | P2 | P2 |
| Deals of the day | Time-boxed offers block | P2 | P1 |
| Quick reorder | One-tap reorder of past staples | P2 | P1 |

## 3. Search · <sub>§5 Search</sub>

| Feature | Description | Phase | Priority |
|---|---|---|---|
| Full-text search | Products + categories (`?q=`) | P2 | P0 |
| Autocomplete suggestions | As-you-type suggestions | P2 | P1 |
| Trending searches | Popular terms | P2 | P2 |
| Recent searches | Per-user history (+ clear) | P2 | P2 |
| Filters on results | Sort/brand/price/size/stock | P2 | P1 |
| Typo tolerance | Fuzzy matching | P2 | P1 |
| No-results handling | Suggestions + popular fallback | P2 | P1 |
| Voice / barcode search | Speak or scan to find | Vision | P2 |

## 4. Catalog & Category Browse · <sub>§3 Categories · §4 Products</sub>

| Feature | Description | Phase | Priority |
|---|---|---|---|
| Category listing | Products within a category | P1 | P0 |
| Brand pages | Browse by brand | P2 | P2 |
| Filters | Sort, brand, price, size, in-stock | P1 | P0 |
| Age-group / dietary filters | Baby age band, veg/organic/allergen | P2 | P1 |
| Collections | Curated shelves (e.g. "Newborn essentials") | P2 | P1 |
| Product compare | Side-by-side comparison | Vision | P2 |

## 5. Product Detail · <sub>§4 Products · §11 Reviews</sub>

| Feature | Description | Phase | Priority |
|---|---|---|---|
| Image gallery | Multiple photos, zoom | P1 | P0 |
| Variants / pack sizes | Size & pack selection | P1 | P0 |
| Price / MRP / discount | Savings display | P1 | P0 |
| Stock + delivery ETA | Availability + "in 10 min" | P1 | P0 |
| Ingredients & age-suitability | Nutrition/allergens for food & formula | P2 | P0 |
| Highlights / about | Rich product content | P1 | P1 |
| Reviews summary | Rating + top reviews | P2 | P1 |
| Related / complementary | Cross-sell rail | P2 | P1 |
| Add to wishlist | Save for later | P2 | P1 |
| Share product | Share sheet / deep link | P2 | P2 |
| Subscribe from PDP | Start a "Subscribe & Forget" | P3 | P1 |
| Notify back-in-stock | Alert when restocked | P2 | P1 |

## 6. Cart · <sub>§6 Cart · §8 Coupons</sub>

| Feature | Description | Phase | Priority |
|---|---|---|---|
| Server cart + guest merge | Cross-device, merge on login | P1 | P0 |
| Qty update / remove | Line-item edits | P1 | P0 |
| Live totals | Subtotal, GST (5%), delivery, discount | P1 | P0 |
| Coupon apply / remove | Validate against cart | P1 | P0 |
| Free-delivery nudge | Progress to free-delivery threshold | P2 | P1 |
| Minimum order value | Enforce + message | P1 | P1 |
| Save for later | Move item to wishlist | P2 | P2 |
| Cross-sell / upsell | "Frequently added" in cart | P2 | P1 |
| Out-of-stock handling | Flag & suggest alternatives | P1 | P1 |

## 7. Checkout & Delivery · <sub>§7 Addresses · §9 Orders</sub>

| Feature | Description | Phase | Priority |
|---|---|---|---|
| Address select / add | Saved + new; map autocomplete | P1 | P0 |
| Express (10-min) delivery | Default quick-commerce slot | P1 | P0 |
| Scheduled slot | Pick a later delivery window | P2 | P1 |
| Delivery instructions | Notes for rider | P2 | P2 |
| Contactless delivery | Leave-at-door option | P2 | P2 |
| Payment method select | Choose at checkout | P1 | P0 |
| Order review & place | Final confirm → order | P1 | P0 |
| Tip rider | Optional post-delivery tip | Vision | P2 |

## 8. Payments · <sub>§10 Payments</sub>

| Feature | Description | Phase | Priority |
|---|---|---|---|
| Razorpay (UPI/cards/netbanking/wallet) | Primary gateway | P1 | P0 |
| Cash on delivery (COD) | Manual handling (Razorpay has no COD) | P1 | P0 |
| Payment retry on failure | Recover failed attempts | P1 | P1 |
| Refunds to source | Auto on cancel/return | P1 | P0 |
| Store wallet / credit | Refunds/cashback as credit | P3 | P1 |
| Saved cards / tokenized UPI | Faster repeat checkout | P2 | P1 |
| EMI / pay-later | Financing options | Vision | P2 |

## 9. Orders & Tracking · <sub>§9 Orders · §10 Payments</sub>

| Feature | Description | Phase | Priority |
|---|---|---|---|
| Order history | Paginated past orders | P1 | P0 |
| Order detail | Items, status, invoice | P1 | P0 |
| Live tracking | Rider location + ETA | P2 | P0 |
| Status timeline | Confirmed → … → delivered | P1 | P1 |
| Invoice PDF | Download GST invoice | P2 | P1 |
| Cancel order | Within cancellation window | P1 | P0 |
| Return / refund (RMA) | Initiate return request | P2 | P1 |
| Reorder | Re-add items to cart | P2 | P1 |
| Rate order | Rate delivery + items | P2 | P2 |
| Per-order help | Contextual support | P2 | P1 |

## 10. Subscriptions — "Subscribe & Forget" · <sub>§14 Subscriptions</sub>

| Feature | Description | Phase | Priority |
|---|---|---|---|
| Create subscription | Auto-delivery of repeat essentials | P3 | P1 |
| Frequency | Weekly / biweekly / monthly / 2-monthly | P3 | P1 |
| Pause / resume / skip | Flexible control | P3 | P1 |
| Edit qty / next date | Adjust upcoming delivery | P3 | P1 |
| Upcoming deliveries | Calendar of what's next | P3 | P1 |
| Subscription discount | Save vs one-off | P3 | P2 |
| Delivery history | Past subscription orders | P3 | P2 |

## 11. Wishlist · <sub>§12 Wishlist</sub>

| Feature | Description | Phase | Priority |
|---|---|---|---|
| Add / remove | Save products for later | P2 | P1 |
| Move to cart | Wishlist → cart | P2 | P1 |
| Price-drop / back-in-stock alerts | Notify on change | P2 | P2 |

## 12. Reviews & Ratings · <sub>§11 Reviews</sub>

| Feature | Description | Phase | Priority |
|---|---|---|---|
| Write review | Rating + title + body | P2 | P1 |
| Review photos | Attach images | P2 | P2 |
| Verified-purchase badge | Trust signal | P2 | P1 |
| Helpful votes | Upvote useful reviews | P2 | P2 |
| Edit / delete own | Manage own reviews | P2 | P1 |

## 13. Profile & Account · <sub>§2 Users · §7 Addresses</sub>

| Feature | Description | Phase | Priority |
|---|---|---|---|
| Mom profile | Name, phone, email, avatar | P2 | P1 |
| Baby profiles (multiple) | Age → milestone recommendations | P2 | P1 |
| Address book | CRUD + default | P1 | P0 |
| Saved payment methods | Manage cards/UPI | P2 | P2 |
| Notification preferences | Channel + category opt-in | P2 | P1 |
| Language preference | EN / HI / TE | P3 | P2 |
| Wallet / credits | Balance + history | P3 | P1 |
| Account stats | Orders/wishlist/cart counts | P2 | P2 |

## 14. Notifications & Messaging · <sub>§13 Notifications</sub>

| Feature | Description | Phase | Priority |
|---|---|---|---|
| Push notifications | FCM / web push | P2 | P0 |
| In-app inbox | Notification center | P2 | P1 |
| Order updates | Status + delivery alerts | P2 | P0 |
| Offers & promos | Marketing pushes (opt-in) | P2 | P1 |
| Back-in-stock / price-drop | Item-level alerts | P2 | P1 |
| Cart-abandonment nudge | Recover abandoned carts | P3 | P1 |
| Channel preferences | Push / SMS / email / WhatsApp | P2 | P1 |

## 15. Offers, Coupons & Loyalty · <sub>§8 Coupons</sub>

| Feature | Description | Phase | Priority |
|---|---|---|---|
| Coupon apply | At cart / checkout | P1 | P0 |
| Offers listing | Browse active offers | P2 | P1 |
| First-order discount | New-user incentive | P1 | P1 |
| Referral program | Refer-a-mom rewards | P3 | P1 |
| Wallet cashback | Credit-back offers | P3 | P2 |
| Loyalty tiers / points | Repeat-purchase rewards | Vision | P2 |
| Scratch cards / gamification | Post-order rewards | Vision | P2 |

## 16. Support & Help

| Feature | Description | Phase | Priority |
|---|---|---|---|
| Help center / FAQ | Self-serve answers | P2 | P1 |
| Order-linked help | Support from an order | P2 | P1 |
| Chat / ticket | Contact support | P2 | P1 |
| Return / refund flows | Guided RMA | P2 | P1 |

## 17. Content & Community <sub>(mom differentiator)</sub>

| Feature | Description | Phase | Priority |
|---|---|---|---|
| Parenting articles / guides | Editorial content | P3 | P2 |
| Age-based tips | Content tuned to baby age | P3 | P2 |
| Milestone tracker | Track baby milestones | Vision | P2 |
| Buying guides | "Which diaper size?" helpers | P3 | P2 |
| Expert content | Pediatrician tips | Vision | P2 |

## 18. PWA & App Capabilities

| Feature | Description | Phase | Priority |
|---|---|---|---|
| Installable PWA | Add-to-homescreen | P1 | P1 |
| Offline browsing | Cache catalog/last state | P2 | P2 |
| Deep links | Open product/order via link | P2 | P1 |
| Share target | Receive shared content | Vision | P2 |
| Push permission prompt | Contextual opt-in | P2 | P1 |

## 19. Localization & Accessibility

| Feature | Description | Phase | Priority |
|---|---|---|---|
| Multi-language | English / Hindi / Telugu | P3 | P1 |
| WCAG accessibility | AA contrast, a11y labels, keyboard nav | P1 | P1 |
| RTL-ready | Layout mirror support | Vision | P2 |

## 20. Cross-cutting Platform Capabilities

> The client-side half of the platform infrastructure. Managed/configured from
> [superadmin](../superadmin/features.md) (§15 Feature Flags, §16 Experimentation, §17 Analytics).

| Feature | Description | Phase | Priority |
|---|---|---|---|
| Feature flags (client) | Gate features by flag/rollout | P2 | P0 |
| Analytics / event tracking | Funnels + product events (view/add/checkout) | P1 | P0 |
| A/B experiment exposure | Render variants, log exposure | P2 | P1 |
| Crash / error reporting | Client error capture (e.g. Sentry) | P1 | P1 |
| Performance / RUM | Web-vitals monitoring | P2 | P1 |
| Consent & cookie mgmt | Tracking consent + privacy | P2 | P1 |
| Attribution / deep-link | Install & campaign attribution | P3 | P2 |
| Session replay | Debug UX issues (opt-in) | Vision | P2 |
