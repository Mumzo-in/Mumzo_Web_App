import { createDb } from "@mumzo/db";
import * as schema from "@mumzo/db/schema/auth";
import { env } from "@mumzo/env/server";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";

export function createAuth() {
  const db = createDb();
  const isProduction = env.NODE_ENV === "production";

  return betterAuth({
    database: drizzleAdapter(db, {
      provider: "pg",

      schema: schema,
    }),
    trustedOrigins: env.CORS_ORIGIN,
    emailAndPassword: {
      enabled: true,
    },
    secret: env.BETTER_AUTH_SECRET,
    baseURL: env.BETTER_AUTH_URL,
    advanced: {
      defaultCookieAttributes: {
        // Cross-origin auth (storefront/admin on their own ports) needs
        // SameSite=None, but browsers only accept that alongside Secure, and
        // reject Secure cookies over plain http://localhost. So dev uses Lax:
        // same-site enough for localhost, and the session cookie sticks.
        sameSite: isProduction ? "none" : "lax",
        secure: isProduction,
        httpOnly: true,
      },
    },
    plugins: [],
  });
}

export const auth = createAuth();
