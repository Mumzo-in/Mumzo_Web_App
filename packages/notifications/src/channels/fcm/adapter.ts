import { existsSync, readFileSync } from "node:fs";
import { dirname, isAbsolute, resolve } from "node:path";
import { env } from "@mumzo/env/server";
import { type App, cert, getApps, initializeApp } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";
import { z } from "zod";

/**
 * Finds a repo-root-relative path regardless of which package the process
 * was started from. `process.cwd()` is the *package* directory under turbo
 * or a direct `bun run`, so resolving against it alone finds the file only
 * when the server happens to be launched from the root.
 *
 * Absolute paths (what a container or a secrets mount would provide) are
 * used as-is. Returns undefined when nothing matches, so the caller can
 * raise an error naming the configured value.
 */
function resolveFromRepoRoot(configured: string): string | undefined {
  if (isAbsolute(configured)) {
    return existsSync(configured) ? configured : undefined;
  }

  let dir = process.cwd();

  while (true) {
    const candidate = resolve(dir, configured);
    if (existsSync(candidate)) {
      return candidate;
    }

    const parent = dirname(dir);
    if (parent === dir) {
      return undefined;
    }
    dir = parent;
  }
}

/** FCM's hard cap on tokens per `sendEach` call. */
const FCM_MULTICAST_LIMIT = 500;

/** Only the three fields Firebase actually needs — the console's JSON
 * carries several more that are irrelevant here. */
const serviceAccountSchema = z.object({
  project_id: z.string().min(1),
  client_email: z.string().min(1),
  private_key: z.string().min(1),
});

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

  app = initializeApp({ credential: cert(resolveCredential()) });
  return app;
}

/**
 * Credentials come from either a service-account JSON file (what the
 * Firebase console downloads) or three discrete env vars. The file wins
 * when both are set — it's the harder one to get subtly wrong, since it
 * needs no PEM transcription.
 */
function resolveCredential() {
  if (env.FCM_SERVICE_ACCOUNT_PATH) {
    const path = resolveFromRepoRoot(env.FCM_SERVICE_ACCOUNT_PATH);

    if (!path) {
      throw new Error(
        `FCM_SERVICE_ACCOUNT_PATH is set to "${env.FCM_SERVICE_ACCOUNT_PATH}", but no such file was found from the repo root or the current directory.`,
      );
    }

    const parsed: unknown = JSON.parse(readFileSync(path, "utf8"));
    const account = serviceAccountSchema.safeParse(parsed);

    if (!account.success) {
      throw new Error(
        `FCM service account at "${path}" is missing required fields (project_id, client_email, private_key).`,
      );
    }

    return {
      projectId: account.data.project_id,
      clientEmail: account.data.client_email,
      privateKey: account.data.private_key,
    };
  }

  if (!env.FCM_PROJECT_ID || !env.FCM_CLIENT_EMAIL || !env.FCM_PRIVATE_KEY) {
    throw new Error(
      "FCM is not configured — set FCM_SERVICE_ACCOUNT_PATH, or all of FCM_PROJECT_ID, FCM_CLIENT_EMAIL, FCM_PRIVATE_KEY.",
    );
  }

  return {
    projectId: env.FCM_PROJECT_ID,
    clientEmail: env.FCM_CLIENT_EMAIL,
    // .env stores literal "\n" sequences — a real multi-line PEM doesn't
    // survive dotenv, so it must be un-escaped before Firebase sees it.
    privateKey: env.FCM_PRIVATE_KEY.replace(/\\n/g, "\n"),
  };
}

/**
 * Errors that mean "this token will never work again" — the device row is
 * deactivated rather than retried.
 *
 * Everything *not* listed here is treated as retryable, which is the safe
 * default: a transient fault that is wrongly called permanent silently
 * unsubscribes a real device, while a permanent fault wrongly called
 * transient only wastes a few retries before the job dies.
 */
const PERMANENT_ERROR_CODES = new Set([
  "messaging/invalid-registration-token",
  "messaging/registration-token-not-registered",
  // What FCM actually returns for a malformed token — verified against the
  // live API, which reports `messaging/invalid-argument` rather than
  // `invalid-registration-token` for a token that isn't well-formed.
  "messaging/invalid-argument",
  // The token belongs to a different Firebase project.
  "messaging/mismatched-credential",
  "messaging/sender-id-mismatch",
  // The app was uninstalled, or the registration was revoked.
  "messaging/invalid-recipient",
  "messaging/unregistered",
]);

/**
 * Errors that are explicitly transient. Listed for documentation value
 * rather than logic — they take the same path as any unrecognised code —
 * so that the retryable set is legible next to the permanent one.
 *
 * `messaging/message-rate-exceeded` and `quota-exceeded` are FCM's 429s.
 * At this project's volume (well under one send per second against a
 * 600k/min project quota) they should never appear, but a broadcast fan-out
 * is exactly the shape of traffic that could trip them.
 */
const RETRYABLE_ERROR_CODES = new Set([
  "messaging/server-unavailable",
  "messaging/internal-error",
  "messaging/unknown-error",
  "messaging/message-rate-exceeded",
  "messaging/quota-exceeded",
  "messaging/authentication-error",
  "messaging/third-party-auth-error",
  "messaging/timeout",
]);

function errorCodeOf(error: unknown): string | undefined {
  if (error && typeof error === "object" && "code" in error) {
    return String((error as { code: unknown }).code);
  }
  return undefined;
}

function isPermanent(error: unknown): boolean {
  const code = errorCodeOf(error);
  if (!code) return false;
  if (RETRYABLE_ERROR_CODES.has(code)) return false;
  return PERMANENT_ERROR_CODES.has(code);
}

function toFailure(error: unknown): SendResult {
  return {
    ok: false,
    error: error instanceof Error ? error.message : "Unknown FCM error",
    errorCode: errorCodeOf(error),
    permanent: isPermanent(error),
  };
}

/**
 * Builds the platform-specific envelope for one rendered notification.
 *
 * The bare `{ notification, data }` form FCM accepts is the lowest common
 * denominator: it leaves Android free to batch the message on a whim,
 * gives iOS no interruption level, and drops the deeplink on web (where
 * `data` is not consulted for click-through). Each platform block below
 * fixes one of those.
 */
function buildMessage(payload: RenderedNotification) {
  const deeplink = payload.deeplink ?? "";
  const data = { deeplink, ...payload.data };

  /**
   * Collapse key: a later notification about the same order replaces an
   * earlier one still sitting in the tray, rather than stacking five
   * entries as an order walks through its statuses. FCM calls this
   * `collapseKey` on Android and `apns-collapse-id` on iOS; both cap at
   * one pending message per key per device.
   */
  const collapseKey = payload.data?.orderId
    ? `order-${payload.data.orderId}`
    : undefined;

  return {
    notification: { title: payload.title, body: payload.body },
    data,
    android: {
      // Order alerts are time-critical for staff — normal priority lets
      // Doze defer them until the next maintenance window.
      priority: "high" as const,
      ...(collapseKey ? { collapseKey } : {}),
      notification: {
        sound: "default",
        ...(collapseKey ? { tag: collapseKey } : {}),
      },
    },
    apns: {
      headers: {
        // 10 = deliver immediately; 5 would let iOS batch for battery.
        "apns-priority": "10",
        ...(collapseKey ? { "apns-collapse-id": collapseKey } : {}),
      },
      payload: {
        aps: {
          sound: "default",
          // Lets the tray show a stacked count rather than nothing.
          badge: 1,
        },
      },
    },
    webpush: {
      headers: { Urgency: "high" },
      // The one place a web click-through is configured — `data.deeplink`
      // alone is not consulted by the browser.
      ...(deeplink ? { fcmOptions: { link: deeplink } } : {}),
    },
  };
}

export const fcmAdapter: ChannelAdapter = {
  channel: "fcm",

  async send(
    payload: RenderedNotification,
    target: DeviceTarget,
  ): Promise<SendResult> {
    try {
      const providerMessageId = await getMessaging(getFcmApp()).send({
        token: target.token,
        ...buildMessage(payload),
      });
      return { ok: true, providerMessageId };
    } catch (error) {
      return toFailure(error);
    }
  },

  /**
   * Multicast send, in batches of `FCM_MULTICAST_LIMIT`.
   *
   * Not a quota measure — FCM allows ~600k messages/minute, orders of
   * magnitude above this project's volume. The win is HTTP overhead: a
   * 100k-recipient broadcast is 200 requests instead of 100,000.
   *
   * `sendEach` returns one response per token *in input order*, which is
   * what lets each result be mapped back to the device row it came from.
   * (`sendMulticast` is deprecated; `sendEach` is its replacement and does
   * not stop at the first failure.)
   */
  async sendMany(
    payload: RenderedNotification,
    targets: DeviceTarget[],
  ): Promise<SendResult[]> {
    if (targets.length === 0) return [];

    const message = buildMessage(payload);
    const results: SendResult[] = [];

    for (let i = 0; i < targets.length; i += FCM_MULTICAST_LIMIT) {
      const batch = targets.slice(i, i + FCM_MULTICAST_LIMIT);

      try {
        const response = await getMessaging(getFcmApp()).sendEach(
          batch.map((target) => ({ token: target.token, ...message })),
        );

        // Index-aligned with `batch` by contract, but a provider that ever
        // broke that alignment would silently deactivate the wrong
        // devices — so a short response falls back to a retryable error
        // rather than guessing.
        for (let j = 0; j < batch.length; j++) {
          const item = response.responses[j];
          const device = batch[j];

          if (!item || !device) {
            results.push({
              ok: false,
              error: "FCM returned no response for this token",
              permanent: false,
            });
            continue;
          }

          if (!item.success) {
            results.push(toFailure(item.error));
            continue;
          }

          results.push({
            ok: true,
            // A success without a message id is possible in the typings;
            // fall back to the device id so the log row still identifies
            // which device the send landed on.
            providerMessageId: item.messageId ?? device.id,
          });
        }
      } catch (error) {
        // A whole-batch failure (network, auth) is not the individual
        // tokens' fault — mark every one retryable.
        for (let j = 0; j < batch.length; j++) {
          results.push(toFailure(error));
        }
      }
    }

    return results;
  },
};
