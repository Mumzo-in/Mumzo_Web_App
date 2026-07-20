import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

import { loadRootEnv } from "./load";

// Must run before createEnv reads process.env. Finds the repo-root `.env`
// regardless of which workspace the process started in.
loadRootEnv();

/** Coerce a decimal env string to a positive integer. */
const intFromEnv = (fallback: number) =>
  z.coerce.number().int().positive().default(fallback);

export const env = createEnv({
  server: {
    /**
     * Postgres connection string. Must point at the `mumzo` database —
     * `infra/docker-compose.yml` only creates the one named in POSTGRES_DB.
     * From inside the compose network the host is `postgres`, not localhost.
     */
    DATABASE_URL: z.url().startsWith("postgres"),
    /**
     * Max connections per process. Postgres allocates ~10 MB each, so this is
     * sized deliberately rather than left to the driver default: with 2 API
     * containers plus a worker this must stay well under `max_connections`.
     */
    DATABASE_POOL_MAX: intFromEnv(10),
    /** Drop a pooled connection after this many seconds idle. */
    DATABASE_IDLE_TIMEOUT: intFromEnv(30),
    /** Fail fast rather than queueing forever when the pool is saturated. */
    DATABASE_CONNECT_TIMEOUT: intFromEnv(10),
    /**
     * Managed providers (Neon/RDS/Supabase) require TLS; local Docker has no
     * certificate, so this defaults off and is switched on per-environment.
     */
    DATABASE_SSL: z
      .enum(["true", "false"])
      .default("false")
      .transform((value) => value === "true"),
    /** Port the Hono server listens on. */
    PORT: intFromEnv(3000),
    BETTER_AUTH_SECRET: z.string().min(32),
    BETTER_AUTH_URL: z.url(),
    /**
     * Comma-separated list of allowed origins — the storefront and the admin
     * panel run on different ports, so this is a list, not a single URL.
     * e.g. "http://localhost:3001,http://localhost:3002"
     */
    CORS_ORIGIN: z
      .string()
      .min(1)
      .transform((value) =>
        value
          .split(",")
          .map((origin) => origin.trim())
          .filter(Boolean),
      )
      .pipe(z.array(z.url()).min(1)),
    NODE_ENV: z
      .enum(["development", "production", "test"])
      .default("development"),
  },
  runtimeEnv: process.env,
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  emptyStringAsUndefined: true,
});
