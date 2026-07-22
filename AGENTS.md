# Mumzo — Agent Rules

Canonical rules for **any** AI agent (Claude Code, Cursor, Gemini, …) working in this repo.
Read this first. Deep-dives live in [`docs/rules/code-rules.md`](docs/rules/code-rules.md) and
[`docs/rules/design-rules.md`](docs/rules/design-rules.md).

> **Mumzo** is a quick-commerce platform for **moms & babies** (10-min delivery, launching in
> Hyderabad). Warm, pastel, premium, nurturing — never a generic tech aesthetic.

## Monorepo map

Bun workspaces + Turborepo.

| Path | What |
|---|---|
| `apps/platform` | Customer storefront — React + TanStack Router + Vite (PWA) |
| `apps/admin` | SuperAdmin control panel |
| `apps/server` | Hono (Bun) API — Better Auth mounted |
| `packages/ui` | `@mumzo/ui` — shadcn/ui component library (Tailwind v4, base-ui) |
| `packages/auth` | `@mumzo/auth` — Better Auth server instance |
| `packages/db` | `@mumzo/db` — Drizzle ORM + Postgres schema |
| `packages/env` | `@mumzo/env` — typed env (`@t3-oss/env-core` + zod) |
| `infra/` | Docker Compose (Postgres) + first-boot SQL |
| `docs/` | Specs & rules (pages, design system, features, api plan) |

**Stack:** Bun · Turborepo · React 19 · TanStack Router (file-based) · Tailwind v4 · shadcn/base-ui ·
Hono · Better Auth · Drizzle/Postgres · **Biome** (lint + format) · Zod.

## Golden rules — always apply

1. **No `any`.** Biome errors on `noExplicitAny`. Use precise types, generics, `unknown`, or
   `as never` only for genuinely dynamic values (e.g. CMS-driven route strings). Never silence
   the type checker with `any`.
2. **Files are kebab-case** — `my-component.tsx`, `use-mobile.ts` — **never** `MyComponent.tsx`.
   The exported React component is still `PascalCase`; only the filename is hyphenated.
3. **Domain-driven structure** — feature code in `modules/<domain>/{api,components,data,index.ts}`,
   shared code in `core/`, routes in `pages/`. Import **across** modules via the barrel
   (`@/modules/<domain>`); **within** a module use relative paths. `core/` must not import from
   `modules/`.
4. **Compose `@mumzo/ui` first.** Check for an existing component before writing custom markup.
   Use built-in variants (`variant`, `size`) before `className`.
5. **Semantic tokens only** — `bg-primary`, `text-muted-foreground`, `border-border`. **Never**
   raw hex or color literals in components. See [design-rules](docs/rules/design-rules.md).
6. **Tailwind hygiene** — `flex gap-*` (never `space-y-*`), `size-*` for equal width/height,
   `cn()` for conditional/merged classes (Biome sorts classes inside `cn`/`cva`/`clsx`),
   self-closing empty elements, **no array index as `key`**.
7. **Respect Biome.** 2-space indent, 80-col, double quotes, organized imports, **no unused
   vars/imports**. Run it; don't fight it.
8. **Type-check before you're done** — `cd apps/<app> && bunx tsc --noEmit` must pass. Don't
   commit a broken TanStack route tree (`routeTree.gen.ts` is generated — never hand-edit).
9. **Use the repo skills** when relevant: `shadcn`, `hono`, `better-auth-best-practices`,
   `turborepo` (under `.claude/skills` & `.agents/skills`).

## Workflow rules — how agents verify & spend effort

1. **Verify with `tsc` + Biome, nothing heavier.**
   `cd apps/<app> && bunx tsc --noEmit` and `bunx biome check <paths>` are the
   acceptance gates. Run tsc after each meaningful chunk, not only at the end —
   a type error caught early is one file to fix, caught late it's ten.
2. **No browser automation. Ever.** Do not install or run Playwright, Puppeteer,
   Selenium, headless Chrome, or any DOM emulator to "see" the UI. The
   verification ceiling for UI is: types pass, Biome passes, the app builds,
   and (when a dev server is already running) modules transform. Pixel review
   is the human's job — say plainly that rendering is unverified instead of
   simulating a browser.
3. **Logic gets executed, not eyeballed.** Pure functions (pricing, tier math,
   filters, pagination) are cheap to prove: write a throwaway `bun run` script
   with assertions, run it, delete it. Prefer that over claiming correctness
   from reading the code.
4. **Be token-frugal.**
   - Read the specific lines you need (`offset`/`limit`, targeted grep), not
     whole files; never re-read a file just edited.
   - Batch repetitive file generation through one script instead of N
     hand-written near-identical files.
   - Don't paste long command output back into prose — summarize the verdict.
   - No exploratory subagents for questions a single grep answers.
5. **Mock-data seam is sacred.** Screens run on `modules/<domain>/data/*.ts`
   behind `api/*.ts` until the real §15 endpoint exists. Never add a `fetch`
   to a component; the swap to the real API must stay a one-file change.
6. **Don't start servers you weren't asked to start**, and never bind port 3000
   (the user runs the Hono server). Admin dev is 3002, platform 3001.
7. **Generated files are read-only** — `routeTree.gen.ts` regenerates; if a
   route id looks wrong, fix the file location, not the generated tree.
8. **When verification is impossible, say so.** "Unverified: rendering" beats a
   confident claim. Never report a step as done that wasn't run.

## Reference docs

- Code conventions → [`docs/rules/code-rules.md`](docs/rules/code-rules.md)
- Design system rules → [`docs/rules/design-rules.md`](docs/rules/design-rules.md)
- Design tokens/typography → [`docs/platform/design-system.md`](docs/platform/design-system.md)
- Routes/pages → [`docs/platform/pages-spec.md`](docs/platform/pages-spec.md)
- Feature roadmap → [`docs/platform/features.md`](docs/platform/features.md) ·
  [`docs/superadmin/features.md`](docs/superadmin/features.md)
- API/domain → [`docs/api/mumzo_api_plan.md`](docs/api/mumzo_api_plan.md)
- Database (setup, migrations, extensions) → [`docs/infra/database.md`](docs/infra/database.md)
- Build order (what to work on next) → [`docs/roadmap.md`](docs/roadmap.md)
