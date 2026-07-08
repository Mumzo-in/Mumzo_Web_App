# Mumzo — Product Requirements Document

## Original Problem Statement
Build a website for Mumzo, a quick commerce startup for mom & baby products launching in Hyderabad. Explain the problem (other q-commerce apps don't stock enough baby SKUs — clothing, toys, food), position Mumzo as the deepest-shelf store dedicated to moms/babies with door-to-door delivery. Note initial launch = Hyderabad. Include a waitlist.

## User Choices (2026-12)
- **Waitlist storage:** Google Sheets requested, MongoDB used in v1 (Sheets sync deferred pending Apps Script URL from user)
- **Waitlist fields:** Name, Email, Address, Baby's name, Baby's age
- **Design vibe:** Warm & playful — soft pastels (peach/sage/cream), rounded, friendly
- **Logo:** User-provided Mumzo wordmark
- **Direction:** Award-worthy execution — kinetic hero, masked line reveal, editorial marquee, numbered manifesto chapters, framer-motion + Lenis smooth scroll

## Personas
- **The Mom (primary):** urban Hyderabad mother, 25–40, tech-comfortable, needs baby essentials quickly and reliably
- **Future Parent:** expecting, wants curation and trust
- **Gift-buyer:** relatives / friends buying for a new mom

## Architecture
- **Frontend:** React 19 (CRA + craco), TailwindCSS, framer-motion 11 for reveals/parallax, Lenis 1.1 for momentum scroll, react-fast-marquee, sonner toasts, shadcn/ui primitives, Fraunces + Manrope + Caveat fonts, custom pastel tokens
- **Backend:** FastAPI, Motor async MongoDB, Pydantic v2 with EmailStr validation
- **DB collections:** `waitlist` — {id, name, email (unique idempotent), address, baby_name, baby_age, created_at}

## API Endpoints
- `GET /api/` — health message
- `POST /api/waitlist` — join (validates email, dedupes by email, returns position)
- `GET /api/waitlist/count` — public counter
- `GET /api/waitlist` — list (internal / admin use)

## What's Implemented (v1 — 2026-12)
- Kinetic hero with masked line-by-line reveal, floating clipped images (arch + circle), warm ambient blobs, handwritten Caveat accent
- Trust strip with 4 stats
- Manifesto: 3 numbered chapters (Problem / Solution / Promise) with parallaxed background numerals and alternating layouts
- Editorial serif marquee ("With love · to your doorstep · in Hyderabad") on sage
- Category bento — 4 clipped product frames (Clothing / Toys / Food / Care) with hover zoom
- Hyderabad launch banner with neighborhood chips and circular launch badge
- How it works — 3 numbered steps
- Waitlist section with validated form, success card w/ position, sonner toasts, duplicate-email idempotency
- Dark ink footer with logo + shelf/company links
- Global grain overlay, custom text selection, pill buttons

## Test Status
- Backend: 6/6 endpoints passing (iteration_1.json)
- Frontend: all critical flows passing — hero, nav, all sections, waitlist form incl. duplicate + validation

## Prioritized Backlog

### P0 (before launch)
- Wire Google Sheets sync (user to share Apps Script URL) — store to Sheets in parallel with Mongo
- Custom domain + favicon + OG image
- Admin export CSV of waitlist

### P1
- Email confirmation to signups (Resend / SendGrid)
- WhatsApp opt-in checkbox (India-specific)
- Categories page with actual SKU teasers
- Pincode gate — show "not in your area yet" for non-Hyderabad pins

### P2
- Blog / parenting guides for SEO
- Referral: "invite a mama" with unique share links
- Investor / press one-pager route
- i18n (Hindi / Telugu)

## Next Tasks
1. Get Google Apps Script deployed URL from user, add `GOOGLE_SHEETS_WEBHOOK_URL` env var, dual-write from `/api/waitlist`
2. Add admin CSV export endpoint
3. Add Resend integration for confirmation emails
