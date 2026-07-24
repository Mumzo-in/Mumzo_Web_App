import { env } from "@mumzo/env/web";
import { phoneNumberClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  // better-auth derives its route-matching base from this URL's path, so the
  // public auth path must equal the server-side mount for the platform
  // instance (apps/server/src/modules/platform/v1/auth → /api/v1/auth).
  baseURL: new URL("/api/v1/auth", env.VITE_SERVER_URL).toString(),
  plugins: [phoneNumberClient()],
});
