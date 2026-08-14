import { env } from "@mumzo/env/web";
import {
  inferAdditionalFields,
  phoneNumberClient,
} from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  // better-auth derives its route-matching base from this URL's path, so the
  // public auth path must equal the server-side mount for the platform
  // instance (apps/server/src/modules/platform/v1/auth → /api/v1/auth).
  baseURL: new URL("/api/v1/auth", env.VITE_SERVER_URL).toString(),
  plugins: [
    phoneNumberClient(),
    // Mirrors the shape of `onboardedAt` on `platformAuth`'s `additionalFields`
    // (packages/auth/src/platform.ts) by hand rather than importing the
    // server auth package — the platform frontend has no other dependency
    // on `@mumzo/auth`, and pulling it in (even type-only) would wire the
    // customer app's package graph to the server's DB/env-validated auth
    // instance. Keep the two definitions in sync if that field ever changes.
    inferAdditionalFields({
      user: {
        onboardedAt: { type: "date", required: false, input: false },
      },
    }),
  ],
});
