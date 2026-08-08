/**
 * Custom migration runner for Supabase (and any PgBouncer-fronted Postgres).
 *
 * `drizzle-kit migrate` runs fine against the pooler URL (port 6543), but
 * PgBouncer in transaction mode can silently swallow DDL — the migrations
 * journal row is inserted but the CREATE TABLE / ALTER TABLE never reach
 * the real DB.
 *
 * This script:
 *   1. Connects via DATABASE_DIRECT_URL (port 5432, no PgBouncer).
 *   2. Runs drizzle-orm's migrate() to apply any brand-new migrations.
 *   3. Re-applies every migration SQL idempotently to heal any DDL that
 *      was journal-recorded but never physically executed.
 *   4. Runs post-migrate setup (extensions etc.).
 *
 * Set DATABASE_DIRECT_URL in .env:
 *   postgresql://postgres:<password>@db.<project-ref>.supabase.co:5432/postgres
 */

import { readdir, readFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { loadRootEnv } from "@mumzo/env/load";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import pg from "pg";

loadRootEnv();

const directUrl = process.env.DATABASE_DIRECT_URL ?? process.env.DATABASE_URL;

if (!directUrl) {
  console.error(
    "❌  Neither DATABASE_DIRECT_URL nor DATABASE_URL is set.\n" +
      "    Add DATABASE_DIRECT_URL=postgresql://postgres:<pass>@db.<ref>.supabase.co:5432/postgres\n" +
      "    to the repo-root .env file.",
  );
  process.exit(1);
}

if (!process.env.DATABASE_DIRECT_URL) {
  console.warn(
    "⚠️  DATABASE_DIRECT_URL is not set — falling back to DATABASE_URL.\n" +
      "   If you are using Supabase, set DATABASE_DIRECT_URL to the direct\n" +
      "   connection (port 5432) to avoid silent DDL failures via the pooler.",
  );
}

const migrationsFolder = resolve(import.meta.dirname, "../src/migrations");

// ── Connect ───────────────────────────────────────────────────────────────────
console.log("🔌  Connecting to Postgres (direct) …");
const client = new pg.Client({ connectionString: directUrl });
await client.connect();
const db = drizzle(client);

// ── Step 1: standard drizzle migrate ─────────────────────────────────────────
console.log("🚀  Running migrations …");
await migrate(db, { migrationsFolder });
console.log("✅  Migrations journal up to date.");

// ── Step 2: idempotent re-apply of all migrations ────────────────────────────
// Re-applies every SQL file idempotently so that DDL which was journal-recorded
// but silently dropped by PgBouncer gets written to the real DB.
console.log("🩺  Re-applying all migrations idempotently …");

// Pre-fetch existing columns to skip ADD COLUMN when already present.
const colRes = await client.query<{ table_name: string; column_name: string }>(
  "SELECT table_name, column_name FROM information_schema.columns WHERE table_schema = 'public'",
);
const existingColumns = new Set(
  colRes.rows.map((r) => `${r.table_name}.${r.column_name}`),
);

const migrationFiles = (await readdir(migrationsFolder))
  .filter((f) => f.endsWith(".sql"))
  .sort();

// Error codes safe to ignore when re-applying idempotently:
// 42P07 = duplicate table  42710 = duplicate object/constraint
// 42701 = duplicate column 23505 = unique violation
// 42P16 = invalid table definition (e.g. adding already-existing constraint)
const IGNORABLE = new Set(["42P07", "42710", "42701", "23505", "42P16"]);

for (const file of migrationFiles) {
  const sql = await readFile(join(migrationsFolder, file), "utf8");

  const statements = sql
    .split("--> statement-breakpoint")
    .map((s) => s.trim())
    .filter(Boolean);

  for (const stmt of statements) {
    // Skip ADD COLUMN if column already exists
    const addColMatch = stmt.match(
      /^ALTER TABLE\s+"?(\w+)"?\s+ADD COLUMN\s+"?(\w+)"?/im,
    );
    if (addColMatch) {
      const key = `${addColMatch[1]}.${addColMatch[2]}`;
      if (existingColumns.has(key)) continue;
    }

    // Make CREATE statements idempotent
    const safeStmt = stmt
      .replace(
        /^(CREATE TABLE)(?!\s+IF NOT EXISTS)/im,
        "CREATE TABLE IF NOT EXISTS",
      )
      .replace(
        /^(CREATE UNIQUE INDEX)(?!\s+IF NOT EXISTS)/im,
        "CREATE UNIQUE INDEX IF NOT EXISTS",
      )
      .replace(
        /^(CREATE INDEX)(?!\s+IF NOT EXISTS)/im,
        "CREATE INDEX IF NOT EXISTS",
      )
      .replace(
        /^(CREATE EXTENSION)(?!\s+IF NOT EXISTS)/im,
        "CREATE EXTENSION IF NOT EXISTS",
      );

    try {
      await client.query(safeStmt);
    } catch (err) {
      const pgErr = err as { code?: string; message?: string };
      if (!IGNORABLE.has(pgErr.code ?? "")) {
        console.warn(
          `   ⚠️  ${file}: skipped stmt (${pgErr.code}): ${pgErr.message?.slice(0, 80)}`,
        );
      }
    }
  }
}

console.log(
  `✅  Idempotent re-apply complete (${migrationFiles.length} files).`,
);

// ── Step 3: post-migrate setup ────────────────────────────────────────────────
console.log("🔧  Running post-migrate setup …");

const extensions = ["pg_trgm", "uuid-ossp", "pgcrypto"];
for (const ext of extensions) {
  await client.query(`CREATE EXTENSION IF NOT EXISTS "${ext}"`);
  console.log(`   ✓  extension ${ext}`);
}

console.log("✅  Post-migrate setup complete.");

await client.end();
process.exit(0);
