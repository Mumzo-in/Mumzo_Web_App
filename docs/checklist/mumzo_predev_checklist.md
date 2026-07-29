# Mumzo — Pre-Development Checklist

> Everything that must be **ready before devs start building** to avoid mid-sprint blockers.  
> Owner: Founders / Product Lead. Dev work can begin once all **Phase 1** items are checked off.

---

## 🔴 Phase 1 — Must-have before any dev starts

### 📜 Legal & Compliance

| Item | Why it's needed | Owner |
|------|----------------|-------|
| **Privacy Policy** page | Required by Razorpay, Google OAuth, Play Store, App Store | Legal |
| **Terms & Conditions** page | Required by payment gateway onboarding | Legal |
| **Return & Refund Policy** page | Required for FSSAI, and Razorpay compliance | Legal |
| **Shipping Policy** page | Shown to customers, required by payment gateways | Legal |
| **GST Registration** | Mandatory to invoice customers and collect GST (you show 5% GST) | Finance |
| **Business entity** (Pvt Ltd / LLP) | Required to open payment gateway accounts | Founders |
| **PAN of the business** | Needed for Razorpay KYC | Finance |
| **Bank account in business name** | Payouts from Razorpay go here | Finance |

> [!IMPORTANT]
> Razorpay **will not activate your live account** without Privacy Policy, T&C, and Return Policy URLs publicly accessible. Host these as static pages before applying.

---

### 💳 Payment Gateway — Razorpay

| Item | Details |
|------|---------|
| Create Razorpay account | [razorpay.com](https://razorpay.com) — sign up with business email |
| Complete KYC | Business PAN, bank account, GST, website URL, Privacy Policy URL |
| Get **Test API keys** | `RAZORPAY_KEY_ID` + `RAZORPAY_KEY_SECRET` for dev/staging |
| Get **Live API keys** | Only after KYC approval (can take 3–7 working days) |
| Enable **Webhook** | Set webhook URL to `https://yourdomain.com/api/v1/payments/webhook` |
| Enable payment methods | UPI, Cards, Net Banking, Wallets — all enabled by default |
| Enable **COD** decision | Is Cash on Delivery needed? If yes, handle manually — Razorpay doesn't do COD |

> [!WARNING]
> KYC approval takes time. Apply for Razorpay live account **early**, even before the app is ready. Dev can use test keys in the meantime.

---

### 📱 SMS / OTP Provider (for phone-based login)

| Item | Details |
|------|---------|
| Choose provider | **Twilio** (global) or **MSG91** (India-focused, cheaper) — MSG91 recommended for INR pricing |
| Register & get API key | `SMS_API_KEY`, `SMS_SENDER_ID` |
| DLT Registration | **Mandatory in India** — register your SMS template on TRAI's DLT portal (via your telecom provider). Takes 3–5 days |
| OTP template approval | Register the OTP SMS template (e.g. "Your Mumzo OTP is {#var#}") |
| Sender ID registration | e.g. `MUMZOO` — must be 6 characters |

> [!CAUTION]
> Without DLT registration, **no OTP SMS will be delivered** in India. This is a regulatory requirement. Start this process immediately — it can take up to a week.

---

### 📧 Transactional Email Provider

| Item | Details |
|------|---------|
| Choose provider | **Resend** (recommended — developer friendly) or SendGrid / Postmark |
| Create account & get API key | `EMAIL_API_KEY` |
| Verify sending domain | Add DNS records for `mail.mumzo.in` — takes 24–48h for DNS propagation |
| Set up email templates | Order confirmation, shipping update, OTP, welcome, password reset |

---

### ☁️ File / Image Storage

| Item | Details |
|------|---------|
| Choose provider | **Cloudflare R2** (cheapest, no egress fees) or AWS S3 |
| Create bucket | `mumzo-products`, `mumzo-avatars`, `mumzo-reviews` |
| Get credentials | `STORAGE_ACCESS_KEY`, `STORAGE_SECRET_KEY`, `STORAGE_BUCKET`, `STORAGE_ENDPOINT` |
| Set up CDN | Point a subdomain `cdn.mumzo.in` to the bucket for fast image delivery |

---

### 🔐 Environment Variables — Full List

Devs need all of these in `.env` before local dev works:

```env
# Database
DATABASE_URL=postgresql://...

# Better Auth
BETTER_AUTH_SECRET=<random 32-char string>
BETTER_AUTH_URL=https://api.mumzo.in

# CORS
CORS_ORIGIN=https://mumzo.in,https://admin.mumzo.in

# Razorpay
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=

# SMS / OTP
MSG91_API_KEY=
MSG91_SENDER_ID=
MSG91_TEMPLATE_ID=

# Email
RESEND_API_KEY=

# Storage
STORAGE_ACCESS_KEY=
STORAGE_SECRET_KEY=
STORAGE_BUCKET=
STORAGE_ENDPOINT=
STORAGE_PUBLIC_URL=https://cdn.mumzo.in

# Push Notifications
FCM_SERVER_KEY=

# Google OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# App
NODE_ENV=development
PORT=3000
```

---

## 🟡 Phase 2 — Needed before public launch

### 🌐 Domain & Infrastructure

| Item | Details |
|------|---------|
| Domain registered | `mumzo.in` — via GoDaddy / Cloudflare Registrar |
| DNS managed | Move DNS to **Cloudflare** for free CDN + DDoS protection |
| Subdomains configured | `api.mumzo.in` (server), `admin.mumzo.in` (admin panel), `cdn.mumzo.in` (images) |
| SSL certificates | Auto via Cloudflare or Let's Encrypt |
| Production hosting | **Railway** / **Render** / **Fly.io** for the Hono server (already dockerized) |
| Postgres hosting | **Neon** (serverless, free tier) or **Supabase** or Railway Postgres |

---

### 🔔 Push Notifications

| Item | Details |
|------|---------|
| Firebase project | Create at [console.firebase.google.com](https://console.firebase.google.com) |
| FCM Server Key | `FCM_SERVER_KEY` — for sending push from the server |
| Web push config | VAPID keys for browser push (`VITE_VAPID_PUBLIC_KEY`) |
| Android app (future) | Need `google-services.json` |

---

### 🗺️ Maps / Address Autocomplete

Address/location autocomplete uses OpenStreetMap's free Nominatim API, proxied
server-side (`apps/server/src/modules/platform/v1/location`) — no API key or
account setup needed. Nominatim's usage policy just requires a descriptive
`User-Agent`, which the server already sends.

---

### 🎨 Design & Brand Assets

| Item | Details |
|------|---------|
| Logo files | SVG + PNG versions (light and dark variants) — already have `logo.png` |
| Brand colors | Pink palette already defined in CSS — confirm HEX codes with designer |
| Font license | `font-editorial` (used in frontend) — confirm it's licensed for web commercial use |
| Product images | Real product photos needed to replace Unsplash placeholders |
| App icon | 1024×1024 PNG for PWA / Play Store / App Store |
| Favicon | 32×32 + 192×192 |
| OG/Social image | 1200×630 for link previews |

---

### 🚚 Delivery / Logistics (if not self-fulfilling)

| Item | Details |
|------|---------|
| Logistics partner | **Shiprocket** / **Delhivery** / **Dunzo** (hyperlocal) |
| API account | Get API key for auto-creating shipments on order placement |
| Pincode serviceability | API to check if delivery is available to a customer's pincode |
| Tracking webhook | Partner sends tracking updates → your server updates order status |

---

### 🏪 Seller / Inventory Source

| Item | Details |
|------|---------|
| Inventory management | Are products self-stocked, or marketplace model? |
| Warehouse address | Needed for shipping label generation |
| SKU system | Define SKU format before cataloguing products |
| Initial catalogue | Minimum viable catalogue (50–100 SKUs) ready before launch |

---

## 🟢 Phase 3 — Before App Store submission

| Item | Details |
|------|---------|
| **Play Store account** | $25 one-time fee — [play.google.com/console](https://play.google.com/console) |
| **App Store account** | $99/year — [developer.apple.com](https://developer.apple.com) |
| **Privacy Policy URL** | Must be publicly accessible (same as web) |
| **Age rating** | Baby products → G/4+ rating |
| **Content policy review** | No adult content, safe for kids category |

---

## 🔑 Access & Accounts Summary

> Create a shared **password manager vault** (1Password / Bitwarden) for the team with all of these:

```
☐ Razorpay (test + live)
☐ MSG91 / Twilio
☐ Resend (email)
☐ Cloudflare (domain + CDN + R2 storage)
☐ Firebase (FCM push)
☐ Google Cloud (OAuth)
☐ Railway / Render (hosting)
☐ Neon / Supabase (Postgres)
☐ GitHub (already have)
☐ Play Store (future)
☐ App Store (future)
```

---

## ✅ Dev Can Start When...

```
☐ Razorpay TEST keys available
☐ MSG91 account created (DLT in progress is fine)
☐ Resend account + domain DNS added
☐ Cloudflare R2 bucket created
☐ Google OAuth client ID created
☐ .env.example filled out and shared via password manager
☐ Privacy Policy, T&C, Return Policy pages drafted (even as Google Doc for now)
☐ DATABASE_URL pointing to a dev Postgres instance
```
