# Mumzo — Design Rules

How to build UI that stays on-brand. The token/type reference is
[`docs/platform/design-system.md`](../platform/design-system.md) (source of truth); this doc is the
**rules** agents must follow. Summary in [`AGENTS.md`](../../AGENTS.md).

> **Brand:** warm, playful, soft pastels, nurturing, premium, craft-driven — a maternal brand.
> **Not** a dark/tech/SaaS aesthetic. Light theme by default.

---

## 1. Color — semantic tokens only

- **Never** put raw hex or color literals in components (`bg-[#1F1B3A]`, `text-white` for brand
  color). Use the semantic token that maps to it. Change the token once → whole app follows.
- Core tokens: `background` (cream), `foreground`/`primary`/`ink` (navy), `card`/`popover`
  (white surface), `secondary`/`muted` (pale cream), `muted-foreground` (soft navy),
  `accent` (peach), `destructive`, `border`, `ring`.
- Brand accents: `peach`, `sage`, `cream`, `ink` — these are **backgrounds/washes**, not text
  (too light for legible text on cream).
- **Legacy pink tokens** (`blush`, `rose`, `pinkDeep`, `pinkSoft`) exist **only** for the
  storefront hero. Do **not** introduce pink elsewhere — the rest of the app is navy/peach.
- No manual `dark:` overrides — tokens handle theming.

## 2. Typography

- **Fraunces** (serif) for all headings — applied to `h1–h6` and via `font-editorial`. Tight
  tracking (`-0.03em` base; add `tracking-tighter` on display sizes). Editorial, airy (weight 300).
- **Manrope** (sans) for body — the default `font-sans`.
- **Caveat** (`font-accent`) for hand-drawn accent notes — sparingly.
- Eyebrow/kicker labels: use the `.kicker` class.

## 3. Shape, shadow, texture

- **Radius:** `--radius: 1rem`. Buttons & tags are **pills** (`rounded-full`). Product frames use
  `rounded-3xl` or the `.frame-arch` (arched clip) utility to break the rectangle.
- **Shadows:** warm & ambient only — `shadow-warm` / `var(--shadow-warm)`. Never hard gray shadows.
- **Grain:** a global SVG grain overlay ships via `body::after` (non-interactive). Don't remove or
  re-implement it per-page.

## 4. Component composition (shadcn / `@mumzo/ui`)

Compose the existing library before writing custom markup. Follow the shadcn skill rules:

- **Use a component before a styled `div`.** Callouts → `Alert`. Empty states → `Empty`. Loading →
  `Skeleton` (no `animate-pulse` divs). Badges → `Badge`. Separators → `Separator` (not `<hr>`).
  Toasts → `sonner` `toast()`.
- **Forms use `Field` / `FieldGroup`** — not raw `div` + `space-y-*`. `InputGroup` for input addons.
  2–5 exclusive options → `ToggleGroup`. Validation: `data-invalid` on `Field`, `aria-invalid` on
  the control.
- **Items live inside their Group** — `SelectItem`→`SelectGroup`, `DropdownMenuItem`→`DropdownMenuGroup`.
- **Overlays need a Title** — `Dialog`/`Sheet`/`Drawer` require a title (`sr-only` if visually hidden).
- **Full `Card` composition** — `CardHeader`/`CardTitle`/`CardContent`/`CardFooter`.
- **Icons in buttons** use `data-icon`; no sizing classes on icons inside components.
- **`className` is for layout, not restyling** component colors/typography.

## 5. Layout & spacing

- `flex gap-*` / `flex flex-col gap-*` — never `space-x/y-*`.
- `size-*` for equal width/height. Generous breathing room; asymmetric, editorial layouts are on-brand.
- Responsive by default: relative units, no horizontal body scroll; wide content scrolls in its own
  container.

## 6. Motion

- Storefront pages stay **restrained**: `transition-colors` / `transition-transform` only.
  **Never** `transition: all` globally.
- Richer motion (Framer Motion reveals, Lenis momentum) is reserved for brand/landing set-pieces.

## 7. Accessibility

- Navy text meets WCAG AA on cream/peach/sage — keep body text on those, never light-on-light.
- Every interactive element gets a **`data-testid`**.
- Decorative images/marquees get `aria-label` / `aria-hidden` as appropriate; icons that convey
  meaning get accessible labels.
