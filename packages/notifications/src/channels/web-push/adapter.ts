import { env } from "@mumzo/env/server";
import webpush, { type PushSubscription, WebPushError } from "web-push";

import type {
  ChannelAdapter,
  DeviceTarget,
  RenderedNotification,
  SendResult,
} from "../../core/types";

let vapidConfigured = false;

function ensureVapidConfigured() {
  if (vapidConfigured) return;

  if (!env.VAPID_PUBLIC_KEY || !env.VAPID_PRIVATE_KEY || !env.VAPID_SUBJECT) {
    throw new Error(
      "Web Push is not configured — set VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT.",
    );
  }

  webpush.setVapidDetails(
    env.VAPID_SUBJECT,
    env.VAPID_PUBLIC_KEY,
    env.VAPID_PRIVATE_KEY,
  );
  vapidConfigured = true;
}

/** Gone (410) / Not Found (404) mean the browser unsubscribed — the
 * subscription will never accept another push, so deactivate the device. */
const PERMANENT_STATUS_CODES = new Set([404, 410]);

export const webPushAdapter: ChannelAdapter = {
  channel: "web-push",
  async send(
    payload: RenderedNotification,
    target: DeviceTarget,
  ): Promise<SendResult> {
    ensureVapidConfigured();

    try {
      // `token` stores the full PushSubscription JSON for this channel.
      const subscription = JSON.parse(target.token) as PushSubscription;
      const result = await webpush.sendNotification(
        subscription,
        JSON.stringify({
          title: payload.title,
          body: payload.body,
          deeplink: payload.deeplink,
          data: payload.data,
        }),
      );
      return {
        ok: true,
        providerMessageId: result.headers.location ?? target.id,
      };
    } catch (error) {
      if (error instanceof WebPushError) {
        return {
          ok: false,
          error: `web-push ${error.statusCode}: ${error.body}`,
          permanent: PERMANENT_STATUS_CODES.has(error.statusCode),
        };
      }
      return {
        ok: false,
        error:
          error instanceof Error ? error.message : "Unknown web-push error",
        permanent: false,
      };
    }
  },
};
