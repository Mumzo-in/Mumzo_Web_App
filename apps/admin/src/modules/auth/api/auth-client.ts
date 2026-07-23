import { env } from "@mumzo/env/web";
import { adminClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

function getServerUrl(url?: string): string {
  const DEFAULT_PROD_API = "https://api.mumzo.in";

  if (url && (url.startsWith("http://") || url.startsWith("https://"))) {
    if (!url.includes("localhost") && !url.includes("127.0.0.1")) {
      return url.endsWith("/") ? url.slice(0, -1) : url;
    }
  }

  if (typeof window !== "undefined") {
    if (window.location.hostname.endsWith("mumzo.in")) {
      return DEFAULT_PROD_API;
    }
    if (url && (url.startsWith("http://") || url.startsWith("https://"))) {
      return url.endsWith("/") ? url.slice(0, -1) : url;
    }
    return window.location.origin;
  }

  if (url && (url.startsWith("http://") || url.startsWith("https://"))) {
    return url.endsWith("/") ? url.slice(0, -1) : url;
  }

  return "http://localhost:3000";
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
  baseURL: new URL(
    "/api/v1/admin/auth",
    getServerUrl(env.VITE_SERVER_URL),
  ).toString(),
  // Mirrors the server's admin plugin. Without it the client has no typed
  // `admin.*` methods (createUser, setRole, listUsers) and no `role` on the
  // session user.
  plugins: [adminClient()],
});
