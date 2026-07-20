# `@mumzo/server`

Hono (Bun) API. Modular monolith — one app, one Postgres, one deployable.

## Where to put things

The question to ask is *what kind of thing is this*, not *what feature is it
for*:

- **A route** → `modules/<surface>/v1/<feature>/routes.ts`
- **Business logic used by one surface** → that module's `service.ts`
- **Business logic used by both surfaces** → `shared/<domain>/`
- **A database query** → that module's `repo.ts` (Drizzle only, no HTTP)
- **A database table** → `packages/db/src/schema/` — never in this app
- **Request/response validation** → the module's `schema.ts` (zod)
- **A fixed value** (codes, roles, limits) → `core/constants/<concern>.ts`
- **A type** → `core/types/` if shared; beside its code if local
- **Middleware** → `core/middleware/<concern>.ts`, one concern per file
- **A pure helper** (money, dates, ids) → `lib/`
- **A third-party client** (Razorpay, MSG91) → `core/integrations/<vendor>/`

Rules of thumb when it's ambiguous:

- If it touches the database, it does **not** belong in `lib/`.
- If it imports Hono, it does **not** belong in `shared/` or `lib/`.
- If getting it wrong costs money or corrupts data, it belongs in `shared/`.
- If two files would need the same value, it belongs in `core/constants/`.

## Layout

```
src/
├── index.ts      # entrypoint: auth mount, health, router, docs
├── router.ts     # main router config — mounting only
├── core/
│   ├── create-app.ts  # createApp() / createRouter() factories
│   ├── response.ts    # ok(), okPaginated() + matching zod schemas
│   ├── errors.ts      # AppError, onError, notFound handler
│   ├── openapi.ts     # spec + Scalar viewer, jsonContent() helper
│   ├── pagination.ts  # ?page&limit&search&sortBy&sortDir
│   ├── constants/     # values only, no logic
│   ├── types/         # types only, no runtime values
│   └── middleware/    # one file per concern
├── lib/          # pure helpers (money) — no DB, no HTTP
├── shared/       # domain logic used by both surfaces — no routes
└── modules/
    ├── platform/v1/   # customer surface → /api/v1
    └── admin/v1/      # staff surface    → /api/v1/admin
```

## Dependency rule

```
router → modules → shared → core / lib
```

- `core/` and `lib/` never import from `modules/`.
- `platform/` and `admin/` never import each other.
- Anything both surfaces need goes in `shared/`.

That last rule is the point of `shared/`: a customer cancelling an order and an
operator cancelling one must release inventory identically. Implement it twice
and one will eventually drift.

## Imports

**`@/` is an alias for `src/`.** Use it for anything outside the current
folder; keep `./` for siblings.

```ts
// ✅ crossing a folder — absolute, and unaffected by moving the file
import { createRouter, ok } from "@/core";
import type { AppEnv } from "@/core/types";

// ✅ same folder — relative
import { clientKey } from "./helpers";

// ❌ never
import { createRouter } from "../../../../core";
```

Beyond readability, `../../../../` silently breaks the moment a file moves one
level; `@/core` does not.

Resolved in all three toolchains — `tsconfig.json` `paths` (typecheck), Bun
(runtime), and tsdown (build). Adding a new top-level folder under `src/`
needs no config change.

## Naming

- Files are **kebab-case** — `create-app.ts`, `rate-limit.ts`. Never
  `CreateApp.ts`.
- Folders are kebab-case and singular for a concern (`middleware/`), plural for
  a collection (`constants/`, `types/`).
- Exported functions are camelCase; types and classes PascalCase.
- Each folder has an `index.ts` barrel. Import a *folder* through its barrel
  (`@/core`); reach for a specific file (`@/core/types`) only when the barrel
  would be circular or needlessly wide.

## Routing

| Path | Serves |
|---|---|
| `/` | Liveness (plain text — the Docker healthcheck greps it) |
| `/health` | Readiness, including a DB check |
| `/api/docs` | Scalar API docs (development only) |
| `/api/docs/openapi.json` | Generated spec (development only) |
| `/api/auth/*` | Better Auth (owns its own routing) |
| `/api/v1/*` | `modules/platform/v1` |
| `/api/v1/admin/*` | `modules/admin/v1` |

Notes:

- **Versions are folders, not path strings.** A v2 is `modules/platform/v2/`
  mounted alongside v1 in `router.ts`, so both serve while clients migrate.
- **`/api/v1/admin` is fixed** by `apps/admin/src/core/api/client.ts`, which
  hardcodes it as `BASE_URL`. Changing the shape here means changing it there.
- **Docs mount only when `NODE_ENV === "development"`** — not staging, not
  test. Publishing a full map of the API, admin routes included, is free
  reconnaissance. Elsewhere they 404 like any unknown path.

## The response envelope

Every response shares one wrapper, so clients have a single shape to parse:

```jsonc
{ "success": true,  "data": { … } }                         // single
{ "success": true,  "data": { "data": [], "meta": { … } } } // list (nested)
{ "success": false, "error": { "code": "…", "message": "…" } }
```

Builders and zod schemas live in `core/response.ts`; type-only versions in
`core/types/response.ts`. The nesting on lists is deliberate —
`apps/admin/src/core/api/client.ts` already depends on it.

## Rate limiting

Applied globally in `createApp()`; tighter limits layer on top per route.

| Limiter | Window | Limit | Use |
|---|---|---|---|
| `globalRateLimit` | 1 min | 300 | Every route, automatically |
| `strictRateLimit` | 1 min | 20 | Search, coupon validation, writes |
| `authRateLimit` | 15 min | 10 | Mounted on `/api/auth/*` |

Clients are keyed by user id when authenticated, falling back to the first
`x-forwarded-for` hop and then the socket address. Keying on IP alone would
throttle a whole household or office behind one NAT as if it were one person.

Exceeding a limit returns `429` in the envelope with code `RATE_LIMITED`, plus
a `RateLimit` header.

> **Before running two containers:** the default store is in-memory, so
> counters are per-process and reset on deploy. Two instances each enforce
> their own separate limit. Switch to the Redis store at that point.

## Adding a feature

Define the route (schema + docs together), then handle it:

```ts
// modules/platform/v1/products/routes.ts
import { createRoute, z } from "@hono/zod-openapi";
import {
  commonErrorResponses,
  createRouter,
  jsonContent,
  pageQuerySchema,
  paginatedSchema,
} from "@/core";

const productSchema = z
  .object({ id: z.string(), name: z.string() })
  .openapi("Product");

const listRoute = createRoute({
  method: "get",
  path: "/",
  tags: ["Platform"],
  summary: "List products",
  request: { query: pageQuerySchema },
  responses: {
    200: jsonContent(paginatedSchema(productSchema), "A page of products"),
    ...commonErrorResponses,
  },
});

export const productRoutes = createRouter().openapi(listRoute, (c) => {
  const { page, limit } = c.req.valid("query"); // typed, defaults applied
  return c.json(
    { success: true as const, data: { data: [], meta: { page, limit, total: 0, hasNext: false } } },
    200,
  );
});
```

Then mount it in `modules/platform/v1/index.ts`:

```ts
const v1 = app.route("/products", productRoutes);
```

Two gotchas worth knowing:

- **Chain `.route()` / `.openapi()`, never mutate.** The returned instance
  carries the inferred type for `hc<AppType>()` on the frontend.
- **Register `.use()` separately.** `.use()` on an `OpenAPIHono` returns a
  plain `Hono`, which drops `.openapi()` from the type. Call `app.use(mw)` on
  its own line, then chain from `app`.

## Conventions

- **Responses** — `ok()` / `okPaginated()`, or `successSchema()` /
  `paginatedSchema()` in a `createRoute`. Never hand-build a body.
- **Errors** — `throw new AppError(...)` or a helper (`notFound`,
  `unauthorized`, `forbidden`, `conflict`, `badRequest`). `app.onError`
  renders it; one place produces error responses.
- **Validation** — every body, param, and query goes through zod. Failures
  return `422 VALIDATION_ERROR` automatically, via the `defaultHook` in
  `create-app.ts`.
- **Constants** — from `core/constants/`, never magic values inline.
- **Money** — integer paise in the DB, rupees on the wire. `lib/money.ts` is
  the only conversion point.
- **Config** — via `@mumzo/env`, never bare `process.env`.
- **No `any`** — Biome errors on it. Use `unknown` and narrow.
- **Formatting** — Biome decides. 2-space, 80 col, double quotes.

## Commands

```bash
bun dev              # hot-reload server on :3000
bun run check-types  # tsc --noEmit
bun run check        # biome (from repo root)
bun db:start         # Postgres via infra/docker-compose.yml
```

Database setup, migrations, and extensions: [`docs/infra/database.md`](../../docs/infra/database.md).

## Status

Skeleton. Both surfaces expose a `/ping` and nothing else; `shared/` and most
of `core/integrations/` are still empty.

**Known gap:** `/api/v1/admin/*` enforces authentication only — any signed-in
customer can reach it. Role gating needs Better Auth's admin plugin and a
`role` column, neither of which exists yet (`plugins: []`). `STAFF_ROLES` in
`core/constants/roles.ts` holds the intended set. Close this before any real
admin endpoint ships.

Implementation order is in `docs/` — foundations, catalog, then the
cart → order → payment path.
