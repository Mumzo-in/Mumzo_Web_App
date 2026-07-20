-- Extensions the schema depends on.
--
-- Runs once, only on an empty data directory. If you add an extension here
-- after the volume already exists, apply it by hand to your local database as
-- well (`docker compose -f infra/docker-compose.yml exec postgres psql -c
-- 'CREATE EXTENSION ...'`) — or `bun db:reset` to rebuild from scratch.
--
-- Managed Postgres (Neon/RDS) will not run this file, so these must also be
-- created by the first migration in any deployed environment.

-- Trigram index support: fuzzy product search ("pamper" -> "Pampers").
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Case-insensitive text, for columns like email where uniqueness must ignore
-- case without a functional index on every lookup.
CREATE EXTENSION IF NOT EXISTS citext;
