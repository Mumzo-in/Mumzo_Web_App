# Mumzo — Code Rules

Detailed coding conventions. The always-apply summary is in [`AGENTS.md`](../../AGENTS.md).
Most of these are **enforced by Biome** (`biome.json`) — this doc explains the intent so agents
write code that passes on the first try.

---

## 1. TypeScript & types

- **No `any`.** `noExplicitAny` is an **error**. Reach for precise types, generics, or `unknown`
  (then narrow). For a genuinely dynamic value the type system can't express (e.g. a CMS-driven
  TanStack route string), `as never` is the escape hatch — not `any`.
- **Strict mode is on.** Handle `null`/`undefined`; don't lean on `!` non-null assertions to
  paper over nullability — narrow properly.
- **Let inference work.** `noInferrableTypes` is on — don't annotate `const n: number = 5`.
- **`as const`** for literal/tuple constants (`useAsConstAssertion`).
- **No parameter reassignment** (`noParameterAssign`) — copy to a local first.
- **Optional params last** (`useDefaultParameterLast`).
- **Enums must be initialized** (`useEnumInitializers`) — prefer union types or `as const` objects
  over enums anyway.
- Prefer **discriminated unions** over boolean flags for state; model impossible states out.
- Validate all external input (API bodies, params, env) with **Zod**; never trust unchecked data.

## 2. Naming

| Thing | Convention | Example |
|---|---|---|
| Files & folders | **kebab-case** | `sign-in-form.tsx`, `hero-slides.ts`, `modules/home/` |
| React components | PascalCase symbol in a kebab file | `export function HeroCarousel()` in `hero-carousel.tsx` |
| Hooks | `use-*` file, `useX` fn | `use-mobile.ts` → `useIsMobile()` |
| Variables / functions | camelCase | `cartTotal`, `submitSearch` |
| Types / interfaces | PascalCase | `HeroSlide`, `CartItem` |
| Constants (module data) | UPPER_SNAKE or camelCase for arrays | `AUTOPLAY_MS`, `heroSlides` |
| Route files | per TanStack | `$productId.tsx`, `_layout.tsx`, `(protected)/` |

> Never `MyComponent.tsx` / PascalCase filenames. (The user calls this "snake case" — in practice
> it's lowercase-with-hyphens, i.e. kebab-case.)

## 3. Imports & module boundaries

- Aliases: `@/*` → `apps/<app>/src/*`; `@mumzo/ui/*`, `@mumzo/db`, `@mumzo/auth`, `@mumzo/env`.
  Never hardcode deep relative paths across areas.
- **Cross-module imports go through the barrel** — `import { UserMenu } from "@/modules/auth"`.
  **Within a module**, use relative paths — `import { authClient } from "../api/auth-client"`.
- Each `modules/<domain>` exposes a public API via `index.ts`. Don't reach into another module's
  internals.
- **`core/` is shared/leaf** — it must **not** import from `modules/`. Dependencies flow
  `pages → modules → core` (and any → `@mumzo/*`).
- `noUnusedImports` / `noUnusedVariables` are **errors**; `organizeImports` runs on save.
- Never hand-edit generated files (`routeTree.gen.ts`); the TanStack plugin regenerates them.

## 4. Project architecture (frontend)

```
apps/platform/src/
  pages/            # TanStack file-based routes (thin — compose modules)
  core/             # shared, cross-cutting UI & hooks (leaf layer)
    components/  hooks/
  modules/<domain>/ # feature slices
    api/  components/  data/  index.ts   # index.ts = public API
  styles/globals.css
```

- Routes stay **thin** — data/logic/UI live in modules; pages wire them together.
- Protected routes live under the pathless `(protected)/` group guarded by `(protected)/_layout.tsx`.
- Content that will be CMS/superadmin-driven later (e.g. hero slides) must be **serializable data**
  (`modules/<domain>/data/*.ts`) fed to a component via props — not hardcoded in JSX.

## 5. React

- Function components + hooks only. Follow the rules of hooks; clean up effects (intervals,
  listeners) in the returned teardown.
- **No array index as `key`** (`noArrayIndexKey` = error) — use a stable id.
- Empty elements self-close (`useSelfClosingElements`).
- `noUselessElse` — return early instead of `else` after a `return`.
- Prefer composition and small components; lift shared UI into `core/` or `@mumzo/ui`.

## 6. Styling in code

See [design-rules.md](./design-rules.md) for the full design system. Code-level essentials:

- **Semantic tokens only** — `bg-primary`, `text-muted-foreground`; never raw hex/`bg-[#...]` in
  components (arbitrary values only for one-off geometry like `rounded-[36px]`).
- `flex gap-*` / `flex flex-col gap-*` — **never** `space-x-*` / `space-y-*`.
- `size-*` when width == height. `truncate` shorthand. No manual `dark:` color overrides.
- Conditional/merged classes via **`cn()`** (from `@mumzo/ui/lib/utils`) — Biome sorts classes
  inside `cn`/`cva`/`clsx`. No manual template-literal class ternaries.
- No manual `z-index` on overlay components (Dialog/Sheet/Popover manage their own stacking).

## 7. Backend (`apps/server`, Hono)

- Hono on Bun. Validate request bodies/params/query with **Zod**.
- Auth is **Better Auth** (`@mumzo/auth`); add capability via plugins, don't hand-roll auth routes.
- DB access via **Drizzle** (`@mumzo/db`); define schema in `packages/db/src/schema`, migrate with
  drizzle-kit. No raw string SQL for app queries.
- Follow the response envelope + error codes in
  [`mumzo_api_plan.md`](../api/mumzo_api_plan.md) (`{ success, data, message }` /
  `{ success, error: { code, message } }`), pagination `?page&limit`.
- Secrets/config only through `@mumzo/env` (typed) — never `process.env.X` scattered in code.

## 8. Formatting & tooling

- Biome is the single source of truth: **2-space** indent, **80** column width, **double quotes**.
  Let it format; don't argue with it.
- `useSortedClasses` is a warning that auto-fixes — keep classes sorted (use `cn`).
- Run before finishing: `bunx tsc --noEmit` (types) and Biome (`biome check`). Both clean.
- Turborepo runs tasks — use `--filter` to scope (`turbo run build --filter=platform`).

## 9. Verification

- Type-check the touched app: `cd apps/<app> && bunx tsc --noEmit` → 0 errors.
- Drive the change in the running app (`bun dev`) when it has a runtime surface — don't rely on
  types alone.
- New routes must appear in `routeTree.gen.ts` (dev server regenerates) and nest correctly.
