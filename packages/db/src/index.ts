import { env } from "@mumzo/env/server";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import * as schema from "./schema";

/**
 * Connection pool. Sized from env rather than left to the driver default —
 * Postgres allocates ~10 MB per connection, so an unbounded pool per process
 * is how a multi-container deploy exhausts `max_connections`.
 */
export function createPool() {
  return new Pool({
    connectionString: env.DATABASE_URL,
    max: env.DATABASE_POOL_MAX,
    idleTimeoutMillis: env.DATABASE_IDLE_TIMEOUT * 1000,
    connectionTimeoutMillis: env.DATABASE_CONNECT_TIMEOUT * 1000,
    // Managed providers terminate TLS with their own CA; local Docker has no
    // certificate at all, hence the explicit toggle.
    ssl: env.DATABASE_SSL ? { rejectUnauthorized: true } : false,
  });
}

export function createDb(pool = createPool()) {
  return drizzle(pool, { schema });
}

export const pool = createPool();
export const db = createDb(pool);

/** Cheap liveness probe — used by the server's health endpoint. */
export async function checkDbConnection() {
  const result = await pool.query("select 1 as ok");
  return result.rows[0]?.ok === 1;
}

export * from "./schema";
