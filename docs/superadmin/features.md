# Mumzo — SuperAdmin (Control Panel) Feature Roadmap

The full feature catalogue for the **ops/admin control panel** (`apps/admin`) behind Mumzo's
quick-commerce operation (moms & babies, 10-min delivery). Covers catalog, inventory,
dark-store & fleet ops, finance, growth, moderation, and the platform-config layer (feature
flags, experiments, analytics). **Living roadmap** — phases guide sequencing.

**Operating model:** own **dark-store fleet** (per-hub inventory + rider dispatch) **with 3PL
fallback** (Shiprocket/Dunzo/Delhivery) for out-of-zone orders.

**Related:** [platform/features.md](../platform/features.md) · [api plan §15](../api/mumzo_api_plan.md) ·
[pre-dev checklist](../checklist/mumzo_predev_checklist.md)

### How to read this

- **Phase** — `P1` MVP · `P2` Growth · `P3` Scale · `Vision` (aspirational).
- **Priority** — `P0` must-have · `P1` important · `P2` nice-to-have.
- **Ref** — backing API in [api plan §15](../api/mumzo_api_plan.md) (SuperAdmin) unless noted.

---

## 1. Auth & Access Control (RBAC) · <sub>§1 Auth · §15k Staff</sub>

| Feature | Description | Phase | Priority |
|---|---|---|---|
| Admin login | Better Auth, admin role gate | P1 | P0 |
| Two-factor auth (2FA) | TOTP/OTP for admin accounts | P2 | P0 |
| Role model | superadmin / admin / catalog_manager / support / finance / ops | P2 | P0 |
| Granular permissions | Per-module capability grants | P3 | P1 |
| Staff management | Invite / edit / revoke admin accounts | P2 | P0 |
| Admin audit log | Every admin action recorded | P2 | P0 |
| Session management | Force-logout, device list | P3 | P1 |

## 2. Dashboard & Analytics · <sub>§15a</sub>

| Feature | Description | Phase | Priority |
|---|---|---|---|
| Ops overview | GMV, orders today, AOV, new users | P1 | P0 |
| Revenue analytics | By day/week/month, filters | P2 | P0 |
| Order funnel & rates | Conversion, cancel & return rates | P2 | P1 |
| Product analytics | Top sellers, low-stock alerts | P2 | P1 |
| User analytics | Signups, retention, cohorts | P3 | P1 |
| Category analytics | Revenue/sales split | P2 | P2 |
| Real-time ops board | Live orders, SLA countdowns | P2 | P0 |
| Scheduled reports / exports | Emailed CSV/PDF | P3 | P2 |
| Customizable widgets | Configurable dashboard | Vision | P2 |

## 3. Catalog — Products · <sub>§15b</sub>

| Feature | Description | Phase | Priority |
|---|---|---|---|
| Product CRUD | Create / edit / soft-delete | P1 | P0 |
| Variants / pack / size | Multi-variant products | P1 | P0 |
| Pricing & MRP | Price, MRP, discount | P1 | P0 |
| Image upload / reorder | Product gallery mgmt | P1 | P0 |
| Rich content | About, highlights, ingredients, age-suitability | P1 | P1 |
| Tags & SEO | Discoverability metadata | P2 | P2 |
| SKU system | Structured SKU per variant | P1 | P1 |
| Stock update | Adjust quantity | P1 | P0 |
| Bulk CSV import / export | Cataloguing at scale | P2 | P1 |
| Bulk edit | Multi-product price/stock edits | P2 | P2 |
| Product bundles / combos | Grouped SKUs | P3 | P2 |
| Approval workflow | Draft → review → publish | P3 | P2 |

## 4. Catalog — Categories & Taxonomy · <sub>§15c</sub>

| Feature | Description | Phase | Priority |
|---|---|---|---|
| Category CRUD | Create / edit / soft-delete | P1 | P0 |
| Reorder categories | Merchandising order | P1 | P1 |
| Category visuals | Image, color, tagline | P1 | P1 |
| Brand management | Brands per category | P2 | P1 |
| Attribute / filter config | Define filterable attributes | P2 | P1 |
| Collections | Curated shelves | P2 | P1 |
| Merchandising | Pin/sort products on home & category | P2 | P1 |

## 5. Inventory & Dark-store / Hub Management · <sub>ops</sub>

| Feature | Description | Phase | Priority |
|---|---|---|---|
| Multi-hub inventory | Stock per dark store | P2 | P0 |
| Stock adjustments | Manual corrections + reasons | P1 | P0 |
| Reorder points / low-stock | Threshold alerts | P2 | P1 |
| Purchase orders / GRN | Inbound stock receiving | P3 | P1 |
| Batch & expiry tracking (FEFO) | Formula/food safety — block expired, alert pre-expiry | P2 | P0 |
| Stock transfers | Between hubs | P3 | P1 |
| Wastage / damage log | Track shrinkage | P3 | P2 |
| Pincode serviceability per hub | Which hub serves which zone | P2 | P0 |

## 6. Order Management · <sub>§15d</sub>

| Feature | Description | Phase | Priority |
|---|---|---|---|
| All orders + filters | By status/date/user | P1 | P0 |
| Order detail | Items, customer, payment, timeline | P1 | P0 |
| Status transitions | Advance order lifecycle | P1 | P0 |
| Assign to hub / rider | Route to fulfilment | P2 | P0 |
| Edit / cancel (reason) | Admin overrides | P1 | P1 |
| Process refund | On cancel/return | P1 | P0 |
| Returns / RMA processing | Approve & track returns | P2 | P1 |
| Exports | Orders CSV by range | P2 | P1 |
| Bulk actions | Multi-order status/print | P2 | P2 |
| Fraud flags | Risky-order detection | P3 | P1 |
| SLA-breach monitoring | Late-order alerts | P2 | P1 |

## 7. Delivery, Fleet & Dispatch (own + 3PL) · <sub>ops · checklist §Delivery</sub>

| Feature | Description | Phase | Priority |
|---|---|---|---|
| Rider onboarding | Profile, docs, KYC | P2 | P0 |
| Rider shifts / availability | Roster & status | P2 | P1 |
| Live dispatch board | Assign orders to riders | P2 | P0 |
| Auto-assignment | Nearest-rider / load-balanced | P3 | P1 |
| Rider live location | Map tracking + route/ETA | P2 | P0 |
| Delivery proof | OTP / photo on delivery | P2 | P1 |
| COD reconciliation | Cash collected vs settled | P2 | P0 |
| Rider payouts / incentives | Earnings & bonuses | P3 | P1 |
| Geofenced zones | Serviceability polygons | P2 | P1 |
| 3PL integration (fallback) | Shiprocket/Dunzo/Delhivery | P2 | P1 |
| Routing rules (own vs 3PL) | When to fall back to 3PL | P3 | P1 |
| Unified tracking + webhooks | One view across own + 3PL | P2 | P1 |
| Rider-facing app | Separate delivery app | Vision | P1 |

## 8. Customer / User Management · <sub>§15e</sub>

| Feature | Description | Phase | Priority |
|---|---|---|---|
| List / search users | By name/email/phone | P1 | P0 |
| User detail | Profile + baby + order history | P1 | P0 |
| Tags & notes | CRM annotations | P2 | P2 |
| Ban / unban | Restrict abusive accounts | P2 | P1 |
| Role change | Promote to staff roles | P2 | P1 |
| GDPR export / delete | Compliance requests | P2 | P1 |
| Wallet adjustments | Credit/debit balance | P3 | P1 |
| Support impersonate | View app as user (audited) | P3 | P2 |
| Segments | Build user cohorts | P3 | P1 |

## 9. Payments, Refunds & Finance · <sub>§15i</sub>

| Feature | Description | Phase | Priority |
|---|---|---|---|
| Payments list | All transactions | P1 | P0 |
| Reconciliation | Gateway vs orders | P2 | P0 |
| Refund processing | Manual + auto refunds | P1 | P0 |
| Failed / pending payments | Recover/retry view | P1 | P1 |
| GST / tax config & invoicing | 5% GST, invoice numbering | P2 | P0 |
| Settlement reports | Razorpay payout reports | P2 | P1 |
| Ledger | Financial ledger view | P3 | P1 |
| COD reconciliation | Tie to rider collections | P2 | P1 |
| Chargeback / dispute handling | Manage disputes | P3 | P2 |

## 10. Coupons, Offers & Promotions · <sub>§15f</sub>

| Feature | Description | Phase | Priority |
|---|---|---|---|
| Coupon CRUD | Flat / pct / BOGO / free-delivery | P1 | P0 |
| Targeting | Category / segment / first-order | P2 | P1 |
| Caps & usage limits | maxUses, per-user, cap | P1 | P1 |
| Schedules | Start/expiry windows | P2 | P1 |
| Usage stats | Redemption analytics | P2 | P2 |
| Auto-apply offers | Rule-based cart offers | P3 | P1 |
| Banner / campaign mgmt | Promo placements | P2 | P1 |
| Referral & loyalty config | Reward rules | P3 | P1 |

## 11. Subscriptions Management · <sub>§15h</sub>

| Feature | Description | Phase | Priority |
|---|---|---|---|
| All subscriptions | List + filters | P3 | P1 |
| Upcoming deliveries | Next 7 days | P3 | P1 |
| Edit / override | Adjust any subscription | P3 | P1 |
| Manual trigger | Force a delivery | P3 | P2 |
| Pause / cancel | Admin control | P3 | P1 |
| Churn view | Cancellation insights | Vision | P2 |

## 12. Reviews & UGC Moderation · <sub>§15g</sub>

| Feature | Description | Phase | Priority |
|---|---|---|---|
| Review queue | Approve / reject / flag | P2 | P1 |
| Spam / profanity filters | Auto-screen | P2 | P1 |
| Q&A moderation | Product questions | P3 | P2 |
| Image moderation | UGC photo review | P3 | P1 |

## 13. CMS / Content Management · <sub>§13 Notifications · content</sub>

| Feature | Description | Phase | Priority |
|---|---|---|---|
| Home banners / hero | Merchandised slots | P2 | P1 |
| Promo blocks & tiles | Home/category placements | P2 | P1 |
| Static / legal pages | Privacy, T&C, Return, Shipping | P1 | P0 |
| Parenting blog / articles | Editorial CMS | P3 | P2 |
| Push / email templates | Reusable message templates | P2 | P1 |
| In-app announcements | Banners/toasts to users | P2 | P2 |
| App config | Min order, delivery-fee rules, ETA, thresholds | P2 | P0 |

## 14. CRM / Engagement & Broadcasts · <sub>§15j</sub>

| Feature | Description | Phase | Priority |
|---|---|---|---|
| Broadcast messaging | Push / SMS / email / WhatsApp | P2 | P1 |
| Segment targeting | Send to cohorts | P3 | P1 |
| Campaign scheduling | Timed sends | P2 | P2 |
| Automated journeys | Cart-abandon, win-back, back-in-stock | P3 | P1 |
| Campaign A/B | Test variants | P3 | P2 |
| Delivery / open analytics | Engagement metrics | P2 | P2 |

## 15. Feature Flags & Remote Config · <sub>platform infra</sub>

| Feature | Description | Phase | Priority |
|---|---|---|---|
| Flag CRUD | Create/toggle flags | P2 | P0 |
| Targeting | Role / segment / % rollout | P2 | P0 |
| Kill switches | Instantly disable a feature | P2 | P0 |
| Environment scoping | dev / staging / prod | P2 | P1 |
| Gradual rollout | Ramp % over time | P3 | P1 |
| Remote config values | Change config without deploy (fees, ETA, thresholds) | P2 | P1 |

## 16. Experimentation (A/B Testing) · <sub>platform infra</sub>

| Feature | Description | Phase | Priority |
|---|---|---|---|
| Experiment setup | Define hypothesis + variants | P3 | P1 |
| Allocation | Traffic split, sticky bucketing | P3 | P1 |
| Goals / metrics | Primary + guardrail metrics | P3 | P1 |
| Results & significance | Stats readout | P3 | P1 |
| Flag-driven exposure | Ties to feature flags (§15) | P3 | P1 |

## 17. Analytics Instrumentation & Data (BI) · <sub>platform infra</sub>

| Feature | Description | Phase | Priority |
|---|---|---|---|
| Event taxonomy / governance | Canonical event schema | P2 | P0 |
| Funnels | Browse → cart → checkout → paid | P2 | P0 |
| Product & ops dashboards | Self-serve BI views | P3 | P1 |
| User-behavior tracking | Sessions, retention, paths | P2 | P1 |
| Warehouse / export | Pipe to BigQuery/warehouse | P3 | P1 |
| Tool integrations | GA4 / PostHog / Mixpanel | P2 | P2 |

## 18. Support / Helpdesk (Ops) · <sub>ops</sub>

| Feature | Description | Phase | Priority |
|---|---|---|---|
| Ticket queue | Inbound support tickets | P2 | P1 |
| Order-linked tickets | Tickets tied to orders | P2 | P1 |
| Canned responses | Reusable replies | P3 | P2 |
| SLA / escalation | Response-time rules | P3 | P2 |
| Live-chat console | Real-time chat with customers | P3 | P2 |
| Refund / return approvals | From the ticket | P2 | P1 |

## 19. Pricing & Merchandising · <sub>ops</sub>

| Feature | Description | Phase | Priority |
|---|---|---|---|
| Dynamic pricing / price zones | Per-zone pricing | P3 | P2 |
| Surge & delivery-fee rules | Demand/time-based fees | P3 | P1 |
| Min-order rules | Per-zone / per-slot | P2 | P1 |
| Recommendation config | Tune personalization | P3 | P2 |
| Search-relevance tuning | Boost/bury, synonyms | P3 | P2 |
| Slot / banner scheduling | Time-boxed placements | P2 | P2 |

## 20. Platform Ops & Integrations · <sub>infra · checklist</sub>

| Feature | Description | Phase | Priority |
|---|---|---|---|
| Admin audit logs | Full action history | P2 | P0 |
| System health / status | Uptime & service status | P2 | P1 |
| Integrations hub | Razorpay, MSG91, Resend, FCM, Maps, WhatsApp, 3PL | P2 | P1 |
| Webhooks & API keys | Manage secrets/keys | P2 | P1 |
| Secrets / config mgmt | Env & credential config | P2 | P1 |
| Backups | DB backup & restore | P2 | P1 |
| Alerting | Ops alerts (Slack/email) | P3 | P1 |
| Multi-city / multi-store scaling | Expand beyond Hyderabad | P3 | P1 |
| Content translation | Localized content (EN/HI/TE) | P3 | P2 |
