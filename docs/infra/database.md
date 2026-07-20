# Mumzo — Database

Postgres 18 · Drizzle ORM · Docker Compose. Everything here is local-dev unless
a section says otherwise.

- **Schema** → `packages/db/src/schema/`
- **Migrations** → `packages/db/src/migrations/` (generated — never hand-edit)
- **Compose** → [`infra/docker-compose.yml`](../../infra/docker-compose.yml)
- **Client + pool** → `packages/db/src/index.ts`

---

## 1. First-time setup

```bash
cp apps/server/.env.example apps/server/.env   # fill in BETTER_AUTH_SECRET
bun install
bun db:start                                   # waits until healthy
bun db:migrate                                 # apply migrations
```

Generate the auth secret with `openssl rand -base64 32` — the env schema
rejects anything under 32 characters.

Verify:

```bash
bun db:psql -- -c '\dt'
```

You should see `account`, `session`, `user`, `verification`.

`infra/.env` is optional. Every compose value has a default; you only need the
file to change a port or the password.

---

## 2. Commands

### Container lifecycle

| Command | What it does |
|---|---|
| `bun db:start` | Start Postgres detached, block until healthy |
| `bun db:watch` | Start in the foreground with logs attached |
| `bun db:stop` | Stop the container, **keep** the data |
| `bun db:down` | Stop and remove the container, **keep** the volume |
| `bun db:logs` | Tail Postgres logs |
| `bun db:psql` | Open `psql` inside the container |
| `bun db:reset` | **Destroy the volume** and start fresh — see §5 |

### Schema workflow

| Command | What it does | Writes a file? | Touches the DB? |
|---|---|---|---|
| `bun db:generate` | Diff schema → new `.sql` migration | Yes | No |
| `bun db:migrate` | Apply pending migrations | No | Yes |
| `bun db:push` | Shove schema straight in, no history | No | Yes |
| `bun db:studio` | Browser UI to inspect data | No | Reads |

`bun db:psql` passes arguments through after `--`:

```bash
bun db:psql -- -c 'select count(*) from "user";'
bun db:psql -- -c '\d+ product'
```

---

## 3. `generate` + `migrate` vs `push`

Two different workflows. Mixing them is how environments drift apart.

**`push`** compares your schema to the live database and mutates it directly.
No file, no history, no review. Fast for solo iteration.

**`generate` + `migrate`** writes a reviewable `.sql` file, then applies it and
records the fact in a `drizzle.__drizzle_migrations` table. Re-running
`migrate` is a no-op — already-applied files are skipped.

### The rule

> **`push` is for local experimentation only. Anything shared — a teammate's
> machine, staging, production — goes through `generate` + `migrate`.**

`push` against production is a data-loss incident waiting to happen: it will
happily drop a column to make the live database match your local schema.

### Normal loop

```bash
# 1. edit packages/db/src/schema/*.ts
bun db:generate          # writes e.g. 0001_lively_hulk.sql
                         # ← read this file before continuing
bun db:migrate           # apply it
git add packages/db/src/migrations   # commit it
```

**Read the generated SQL before applying it.** `strict: true` in
`drizzle.config.ts` prompts before destructive operations, but the file is
where you catch an unintended `DROP COLUMN`.

**Commit migrations.** They are shared history — a migration that only exists
on your machine is worse than no migration.

---

## 4. Extensions

Two places create extensions, for two different reasons.

### Local Docker — [`infra/postgres/init/01-extensions.sql`](../../infra/postgres/init/01-extensions.sql)

| Extension | Why |
|---|---|
| `pg_trgm` | Trigram indexes for fuzzy search — "pamper" → "Pampers" |
| `citext` | Case-insensitive text for columns like email |

This runs **once**, only when the data directory is empty. It is a
first-boot hook, not a migration.

### Everywhere else — the migration

> **Managed Postgres (Neon, RDS, Supabase) never runs the init script.**

So any migration that depends on an extension must create it too:

```sql
CREATE EXTENSION IF NOT EXISTS pg_trgm;
```

`IF NOT EXISTS` is a harmless no-op locally (already created at first boot) and
load-bearing in production. **The migration is the source of truth; the init
script is a local convenience.**

### Adding an extension to an existing local database

The init script won't re-run on a volume that already has data. Either:

```bash
bun db:psql -- -c 'CREATE EXTENSION IF NOT EXISTS unaccent;'
```

or `bun db:reset` to rebuild from scratch.

---

## 5. Resetting

```bash
bun db:reset      # docker compose down -v && db:start
bun db:migrate    # reset does NOT re-apply migrations
```

**`db:reset` deletes all local data.** The `-v` flag removes the volume; the
init script re-runs against the now-empty directory, so extensions come back
but tables do not.

Reach for it when migrations conflict, the schema is in an unknown state, or
you want to verify a migration applies cleanly from empty.

---

## 6. Where files live

```
packages/db/
├── drizzle.config.ts          # schema in, migrations out
└── src/
    ├── index.ts               # pool + drizzle client + checkDbConnection()
    ├── schema/                # ← you edit these
    │   ├── auth.ts
    │   └── index.ts           # barrel — new tables must be exported here
    └── migrations/            # ← generated, committed, never hand-edited
        ├── 0000_deep_unicorn.sql
        └── meta/
            ├── _journal.json  # ordered list of applied migrations
            └── 0000_snapshot.json

infra/
├── docker-compose.yml         # Postgres
├── docker-compose.server.yml  # optional API overlay
└── postgres/init/             # first-boot SQL, Docker only
```

Two things named "schema" — keep them apart:

- `packages/db/src/schema/` → **Drizzle tables**
- `apps/server/src/modules/*/schema.ts` → **zod validation**

A new table is invisible to `db:generate` until it is exported from
`schema/index.ts`. That is the most common reason a migration comes out empty.

---

## 7. Configuration

Set in `apps/server/.env` — see [`.env.example`](../../apps/server/.env.example).
Parsed and validated by `packages/env/src/server.ts`; the server refuses to
boot on a bad value rather than failing later at connect time.

| Variable | Default | Notes |
|---|---|---|
| `DATABASE_URL` | — | Must point at the `mumzo` database |
| `DATABASE_POOL_MAX` | `10` | Per process. Postgres allocates ~10 MB per connection |
| `DATABASE_IDLE_TIMEOUT` | `30` | Seconds before an idle connection is dropped |
| `DATABASE_CONNECT_TIMEOUT` | `10` | Seconds before giving up on a connection |
| `DATABASE_SSL` | `false` | `true` on managed Postgres; local Docker has no cert |

Compose defaults (override in `infra/.env`): `POSTGRES_DB=mumzo`,
`POSTGRES_USER=postgres`, `POSTGRES_PASSWORD=password`, `POSTGRES_PORT=5432`.

**The database name must agree in both places.** `DATABASE_URL` ends in
`/mumzo` and `POSTGRES_DB` is `mumzo`. Postgres only auto-creates the single
database named in `POSTGRES_DB`, so a mismatch fails with
`database "…" does not exist`.

### Host vs container

| Running from | Host in `DATABASE_URL` |
|---|---|
| Host (`bun dev`, drizzle-kit) | `localhost` |
| Inside compose | `postgres` |

The server overlay sets this automatically; you only hit it if you run
something in a container by hand.

---

## 8. Troubleshooting

**`database "mumzo_app" does not exist`** — `DATABASE_URL` and `POSTGRES_DB`
disagree. The URL must end in `/mumzo`.

**`ECONNREFUSED 127.0.0.1:5432`** — container isn't up. `bun db:start`, then
`docker compose -f infra/docker-compose.yml ps` to confirm it reports healthy.

**Port 5432 already allocated** — a system Postgres owns the port. Set
`POSTGRES_PORT=5433` in `infra/.env`, update `DATABASE_URL` to match, and
`bun db:down && bun db:start`.

**`DATABASE_URL is not set`** from drizzle-kit — `apps/server/.env` is missing.
drizzle-kit reads it via `dotenv` in `drizzle.config.ts`.

**`db:generate` produced an empty migration** — the new table isn't exported
from `packages/db/src/schema/index.ts`.

**`type "…" already exists` on migrate** — the database was previously `push`ed,
so it holds objects no migration knows about. Locally: `bun db:reset && bun
db:migrate`. This is exactly the drift §3 warns about.

**Extension missing after adding it to the init script** — that script only
runs on an empty volume. Create it by hand or `bun db:reset` (§4).

---

## 9. Production notes

Not yet provisioned — this is the intended shape.

- **Managed Postgres.** Neon or RDS. Self-hosting to save a few thousand rupees
  a month while running payments is a bad trade.
- **`DATABASE_SSL=true`** everywhere outside local Docker.
- **`db:migrate` only.** `push` must never reach a deployed database. Run
  migrations as a deploy step, before the new version starts serving.
- **Never run the init script.** Extensions come from migrations (§4).
- **Pool sizing.** Sum of `DATABASE_POOL_MAX` across every process must stay
  under the server's `max_connections` (100 locally). Add PgBouncer in
  transaction mode when container count grows — note it breaks prepared
  statements (`prepare: false`), advisory locks, and `LISTEN/NOTIFY`.
- **Test the restore, not the backup.** Restore into a scratch database and
  run a real query against it. An untested backup is not a backup.
