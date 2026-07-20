import { env } from "@mumzo/env/web";
import { adminClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

function getServerUrl(url: string) {
  const normalized = url.endsWith("/") ? url.slice(0, -1) : url;

  if (!normalized.startsWith("/")) {
    return normalized;
  }

  if (typeof window !== "undefined") {
    return `${window.location.origin}${normalized}`;
  }

  const processEnv = (
    globalThis as {
      process?: { env?: Record<string, string | undefined> };
    }
  ).process?.env;
  const vercelUrl =
    processEnv?.VERCEL_ENV === "production"
      ? (processEnv?.VERCEL_PROJECT_PRODUCTION_URL ?? processEnv?.VERCEL_URL)
      : (processEnv?.VERCEL_URL ?? processEnv?.VERCEL_PROJECT_PRODUCTION_URL);
  if (vercelUrl) {
    const origin = vercelUrl.startsWith("http")
      ? vercelUrl
      : `https://${vercelUrl}`;
    return `${origin}${normalized}`;
  }

  return `http://localhost:3000${normalized}`;
}

/**
 * Staff auth client — talks to the **admin** Better Auth instance.
 *
 * Distinct from the storefront's client: a different mount path, a different
 * cookie, and different tables. The two are not interchangeable, so this file
 * must never be imported by `apps/platform`.
 */
export const authClient = createAuthClient({
  // better-auth derives its route-matching base from this URL's path, so this
  // must equal the server-side mount exactly — `basePath` in
  // `packages/auth/src/admin.ts`.
  baseURL:
    typeof window !== "undefined"
      ? `${window.location.origin}/api/v1/admin/auth`
      : new URL(
          "/api/v1/admin/auth",
          getServerUrl(env.VITE_SERVER_URL),
        ).toString(),
  // Mirrors the server's admin plugin. Without it the client has no typed
  // `admin.*` methods (createUser, setRole, listUsers) and no `role` on the
  // session user.
  plugins: [adminClient()],
});
