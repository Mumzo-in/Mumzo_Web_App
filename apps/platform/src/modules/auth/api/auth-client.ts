import { env } from "@mumzo/env/web";
import { phoneNumberClient } from "better-auth/client/plugins";
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
export const authClient = createAuthClient({
  // better-auth derives its route-matching base from this URL's path, so the
  // public auth path must equal the server-side mount for the platform
  // instance (apps/server/src/modules/platform/v1/auth → /api/v1/auth).
  baseURL: new URL(
    "/api/v1/auth",
    getServerUrl(env.VITE_SERVER_URL),
  ).toString(),
  plugins: [phoneNumberClient()],
});
