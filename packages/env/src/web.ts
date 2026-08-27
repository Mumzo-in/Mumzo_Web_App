import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  clientPrefix: "VITE_",
  client: {
    VITE_SERVER_URL: z.url(),
    /**
     * Firebase web-app config, for FCM push registration in the browser.
     *
     * Public by design — this is the config Firebase embeds in client
     * bundles, and it identifies the project rather than authorising
     * anything. The *server* half (the service-account private key) lives
     * in `server.ts` and must never appear here.
     *
     * Optional so the apps still boot without push configured; the
     * messaging module treats an unset value as "push unavailable" rather
     * than throwing at import time.
     */
    VITE_FIREBASE_API_KEY: z.string().min(1).optional(),
    VITE_FIREBASE_AUTH_DOMAIN: z.string().min(1).optional(),
    VITE_FIREBASE_PROJECT_ID: z.string().min(1).optional(),
    VITE_FIREBASE_STORAGE_BUCKET: z.string().min(1).optional(),
    VITE_FIREBASE_MESSAGING_SENDER_ID: z.string().min(1).optional(),
    VITE_FIREBASE_APP_ID: z.string().min(1).optional(),
    /** Public VAPID key passed to `getToken()` for web push. */
    VITE_FIREBASE_VAPID_KEY: z.string().min(1).optional(),
  },
  runtimeEnv: import.meta.env,
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  emptyStringAsUndefined: true,
});
