-- Custom SQL migration file, put your code below! --

-- Fuzzy/typo-tolerant search for `GET /api/v1/products?search=`.
-- `pg_trgm` is provisioned by the local first-boot script
-- (infra/postgres/init/01-extensions.sql), but that script never runs
-- against managed Postgres (Neon/RDS/Supabase) or an existing local volume —
-- the migration is the source of truth, per docs/infra/database.md.
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- GIN trigram indexes so `similarity()`/`%` on these columns can use an
-- index instead of a sequential scan once the catalog grows past a handful
-- of rows.
CREATE INDEX IF NOT EXISTS "product_name_trgm_idx" ON "product" USING gin ("name" gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "brand_name_trgm_idx" ON "brand" USING gin ("name" gin_trgm_ops);
