import { env } from "@mumzo/env/server";
import { type App, cert, getApps, initializeApp } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";

import type {
  ChannelAdapter,
  DeviceTarget,
  RenderedNotification,
  SendResult,
} from "../../core/types";

let app: App | undefined;

function getFcmApp(): App {
  if (app) return app;

  const existing = getApps()[0];
  if (existing) {
    app = existing;
    return app;
  }

  if (!env.FCM_PROJECT_ID || !env.FCM_CLIENT_EMAIL || !env.FCM_PRIVATE_KEY) {
    throw new Error(
      "FCM is not configured — set FCM_PROJECT_ID, FCM_CLIENT_EMAIL, FCM_PRIVATE_KEY.",
    );
  }

  app = initializeApp({
    credential: cert({
      projectId: env.FCM_PROJECT_ID,
      clientEmail: env.FCM_CLIENT_EMAIL,
      // .env stores literal "\n" sequences — a real multi-line PEM doesn't
      // survive dotenv, so it must be un-escaped before Firebase sees it.
      privateKey: env.FCM_PRIVATE_KEY.replace(/\\n/g, "\n"),
    }),
  });
  return app;
}

/** Token errors FCM reports that mean "this token will never work again" —
 * the device row should be deactivated rather than retried. */
const PERMANENT_ERROR_CODES = new Set([
  "messaging/invalid-registration-token",
  "messaging/registration-token-not-registered",
]);

export const fcmAdapter: ChannelAdapter = {
  channel: "fcm",
  async send(
    payload: RenderedNotification,
    target: DeviceTarget,
  ): Promise<SendResult> {
    try {
      const providerMessageId = await getMessaging(getFcmApp()).send({
        token: target.token,
        notification: { title: payload.title, body: payload.body },
        data: { deeplink: payload.deeplink ?? "", ...payload.data },
      });
      return { ok: true, providerMessageId };
    } catch (error) {
      const code =
        error && typeof error === "object" && "code" in error
          ? String((error as { code: unknown }).code)
          : undefined;
      return {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown FCM error",
        permanent: code ? PERMANENT_ERROR_CODES.has(code) : false,
      };
    }
  },
};
