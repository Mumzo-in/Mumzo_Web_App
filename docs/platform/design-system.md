# Mumzo — Design System

The visual language for the Mumzo storefront (`apps/platform`). Source of truth:
`Mumzo_Web_App/design_guidelines.json`. Tokens live in
`apps/platform/src/styles/globals.css` (Tailwind v4, `@theme inline`), layered over the
shadcn base in `@mumzo/ui`.

> **Golden rule:** style with **semantic tokens**, never raw hex. `bg-primary`,
> `text-muted-foreground`, `border-border` — not `bg-[#1F1B3A]`. Change a token once and the
> whole app follows. See `.claude/skills/shadcn/customization.md`.

## Brand & vibe

Warm, playful, soft pastels, nurturing, premium, craft-driven — a maternal brand, **not** a
standard tech/SaaS aesthetic. **Light theme only.** Editorial typography does the heavy
lifting; color stays calm and pastel with navy as the anchor.

## Color system

Navy is both the **ink** (text) and the **primary** action color. Peach / sage / cream are
**surface & wash** accents — use them as backgrounds, not text (they're too light for legible
text on cream).

| Token | CSS var | Utility | Hex | Use |
|---|---|---|---|---|
| Background | `--background` | `bg-background` | `#FDFBF7` | Page — warm cream |
| Foreground | `--foreground` | `text-foreground` | `#1F1B3A` | Default text (navy) |
| Primary | `--primary` | `bg-primary` | `#1F1B3A` | Buttons, CTAs, links |
| Primary fg | `--primary-foreground` | `text-primary-foreground` | `#FDFBF7` | Text on navy |
| Card / surface | `--card` | `bg-card` | `#FFFFFF` | Cards, inputs, raised surfaces |
| Secondary | `--secondary` | `bg-secondary` | `#F6F3EC` | Secondary surfaces |
| Muted | `--muted` | `bg-muted` | `#F6F3EC` | Muted fills |
| Muted fg | `--muted-foreground` | `text-muted-foreground` | `#5A566E` | Captions, meta, placeholders |
| Accent | `--accent` | `bg-accent` | `#FDE2CE` | Peach hover / wash |
| Destructive | `--destructive` | `bg-destructive` | `#C0392B` | Errors, delete |
| Border | `--border` | `border-border` | `#E5E0D8` | 1px structural lines |
| Input | `--input` | — | `#E5E0D8` | Input borders |
| Ring | `--ring` | `ring-ring` | `#1F1B3A` | Focus ring (navy) |

### Brand accents (bespoke — beyond shadcn)

| Token | Utility | Hex | Use |
|---|---|---|---|
| Peach | `bg-peach` / `text-peach` | `#FDE2CE` | Hyderabad banner, warm washes |
| Sage | `bg-sage` | `#D8E2D5` | Calm sections, editorial marquee |
| Cream | `bg-cream` | `#F6F3EC` | Soft section washes |
| Ink | `text-ink` / `bg-ink` | `#1F1B3A` | Navy — text, wordmark |

> **Contrast:** navy `#1F1B3A` passes WCAG AA on `#FDFBF7`, `#FDE2CE`, and `#D8E2D5`. Do not
> put body text in peach/sage/cream on cream.

## Typography

Import: Fraunces, Manrope, Caveat (Google Fonts, in `globals.css`).

| Role | Family | Token / class | Notes |
|---|---|---|---|
| Headings | **Fraunces** (serif) | `font-editorial` / all `h1–h6` | Editorial. Tight tracking (`-0.03em` base; use `tracking-tighter` on display sizes). Optical sizing on. |
| Body | **Manrope** (sans) | `font-sans` (default) | Clean legibility. |
| Accent | **Caveat** (cursive) | `font-accent` | Hand-drawn notes only — sparingly. |

Weights: `light 300 · regular 400 · medium 500 · semibold 600 · bold 700`. Headings default to
`300` for an airy editorial feel. Eyebrow labels: the `.kicker` class (uppercase, wide
tracking, navy).

## Radius & shape

`--radius: 1rem`. Scale: `rounded-sm/md/lg/xl/2xl/3xl` derive from it.

- **Buttons & tags → pill** (`rounded-full`).
- **Product frames → `rounded-3xl`** or the **`.frame-arch`** utility (arched top clip) to
  break the rectangle.
- Cards / panels → `rounded-2xl`/`rounded-3xl`.

## Shadows

Warm, ambient, diffuse — never hard/gray. Use the **`shadow-warm`** utility
(`0 12px 40px rgb(31 27 58 / 0.08)`) or `var(--shadow-warm)` in raw CSS.

## Texture

A fixed SVG **grain overlay** (`feTurbulence`) is applied globally via `body::after`
(`fixed inset-0`, `pointer-events-none`, `mix-blend-multiply`, `opacity 0.4`) for a tactile,
printed feel. It never blocks interaction and is disabled in print. To keep a region crisp,
raise it above the overlay's stacking context or place it in its own layer.

## Motion

- **Storefront pages stay restrained:** `transition-colors` / `transition-transform` only.
  **Never** apply `transition: all` globally.
- **Brand set-pieces** (landing/marketing) may use richer motion: Framer Motion line-by-line
  reveals (wrap lines in `overflow-hidden`, animate inner spans `y: 100% → 0%`, ease
  `[0.16, 1, 0.3, 1]`), `whileInView` fades, and `@studio-freight/react-lenis` momentum
  scrolling (Lenis compat CSS already ships in `globals.css`).

## Components

- **Compose `@mumzo/ui` (shadcn) first** — check the installed set before writing custom
  markup. Use built-in variants (`variant="outline"`, `size="sm"`) before `className`.
- **Semantic tokens only** in `className` — layout/spacing is fine, color/typography overrides
  are not.
- **Brand helpers** for non-shadcn surfaces: `.mumzo-btn` (navy pill CTA), `.mumzo-btn-ghost`
  (bordered), `.mumzo-input` (soft peach focus ring).
- Follow the shadcn skill rules (`.claude/skills/shadcn/SKILL.md`): `flex gap-*` not
  `space-y-*`; `size-*` for equal w/h; `cn()` for conditional classes; forms use
  `FieldGroup`/`Field`; `Separator` not `<hr>`; `Badge` not styled spans.

## Accessibility

- Navy text on all brand backgrounds meets AA (see contrast note above).
- Every interactive element carries a **`data-testid`**.
- Decorative imagery and the marquee get **`aria-label`** / `aria-hidden` as appropriate.

## Brand set-pieces (landing reference)

These live in the marketing surface, not the storefront system, but share the tokens above:
**KineticHero** (masked Fraunces reveal + drifting arch-clipped imagery), **EditorialMarquee**
(sage ribbon, large italic Fraunces), **ManifestoChapters** (asymmetric bento, massive
background numerals, a Caveat note), **WaitlistForm** (pill inputs, soft focus, "Join the
Waitlist").

---
_Tokens: `apps/platform/src/styles/globals.css` · Pages: `docs/platform/pages-spec.md`_
