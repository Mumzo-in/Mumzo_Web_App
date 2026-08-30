import { db } from "@mumzo/db";
import { notificationLog } from "@mumzo/db/schema/notifications";
import { and, eq, inArray, sql } from "drizzle-orm";

import { log } from "../../core/log";

/**
 * Processes WhatsApp delivery receipts into `notification_log`.
 *
 * Without this, every WhatsApp row rests at `sent` forever — which means
 * "the provider accepted it", not "it arrived". Meta rejects plenty of
 * messages *after* accepting them (number not on WhatsApp, user blocked
 * the business, template paused mid-send), and those arrive only as a
 * status callback. Recording them is the difference between a log that
 * answers "did the customer get it?" and one that only answers "did we
 * try?".
 */

/**
 * Meta's status values, in lifecycle order. Ranked because callbacks are
 * **not ordered** — `delivered` and `read` for the same message can arrive
 * in either order, and a late `sent` must never overwrite an earlier
 * `delivered`.
 */
const STATUS_RANK: Record<string, number> = {
  accepted: 0,
  sent: 1,
  delivered: 2,
  read: 3,
  // Terminal failure — ranked highest so it always wins, since a failure
  // is the most actionable thing the log can record.
  failed: 4,
};

/** How a Meta status maps onto the log's own vocabulary. */
function toLogStatus(metaStatus: string): string {
  switch (metaStatus) {
    case "delivered":
    // A read message was necessarily delivered; the log has no separate
    // "read" state, and conflating them would lose the delivery signal.
    case "read":
      return "delivered";
    case "failed":
      return "failed";
    default:
      return "sent";
  }
}

export type WhatsAppStatusUpdate = {
  /** Provider message id — matches `notification_log.provider_message_id`. */
  id: string;
  status: string;
  timestamp?: string;
  errors?: Array<Record<string, unknown>>;
};

/** Pulls the first error's code/title out of Meta's loosely-typed array. */
function readError(errors?: Array<Record<string, unknown>>): {
  code?: string;
  message?: string;
} {
  const first = errors?.[0];
  if (!first) return {};

  const code = first.code;
  const title = first.title ?? first.message;
  const detail = (first.error_data as { details?: unknown } | undefined)
    ?.details;

  return {
    code: code === undefined ? undefined : String(code),
    message: [title, detail].filter(Boolean).join(" — ") || undefined,
  };
}

/**
 * Applies one batch of status updates.
 *
 * Returns how many log rows were actually changed, which the webhook logs
 * — a callback matching nothing usually means the send wasn't recorded, or
 * arrived for a different environment sharing the same WhatsApp number.
 */
export async function applyStatusUpdates(
  updates: WhatsAppStatusUpdate[],
): Promise<{ matched: number; skipped: number }> {
  let matched = 0;
  let skipped = 0;

  for (const update of updates) {
    const incomingRank = STATUS_RANK[update.status] ?? 0;
    const logStatus = toLogStatus(update.status);
    const { code, message } = readError(update.errors);

    // Meta sends a unix-seconds string; fall back to now when absent.
    const seconds = Number(update.timestamp);
    const occurredAt = Number.isFinite(seconds)
      ? new Date(seconds * 1000)
      : new Date();

    /**
     * The guard here is the whole point: callbacks arrive out of order and
     * more than once, so an update only lands when it represents forward
     * progress. Comparing against the row's *current* status inside the
     * UPDATE keeps that atomic — two callbacks racing on the same row
     * would otherwise both read "sent" and the loser would clobber the
     * winner.
     */
    const currentRank = sql`CASE ${notificationLog.status}
      WHEN 'queued' THEN 0
      WHEN 'sent' THEN 1
      WHEN 'delivered' THEN 2
      WHEN 'failed' THEN 4
      ELSE 0 END`;

    const result = await db
      .update(notificationLog)
      .set({
        status: logStatus,
        ...(logStatus === "delivered" ? { deliveredAt: occurredAt } : {}),
        ...(logStatus === "failed"
          ? {
              error: message ?? "WhatsApp reported a delivery failure",
              errorCode: code ?? "whatsapp_failed",
            }
          : {}),
      })
      .where(
        and(
          eq(notificationLog.providerMessageId, update.id),
          eq(notificationLog.channel, "whatsapp"),
          sql`${currentRank} < ${incomingRank}`,
        ),
      )
      .returning({ id: notificationLog.id });

    if (result.length > 0) {
      matched += result.length;
    } else {
      skipped++;
    }
  }

  return { matched, skipped };
}

/**
 * Deactivates phone "devices" whose number Meta says is undeliverable, so
 * a dead number stops consuming a send attempt on every future order.
 *
 * Kept separate from `applyStatusUpdates` because it is a much bigger
 * hammer: it stops all future WhatsApp to that person, so it fires only on
 * the narrow set of codes that genuinely mean "never again".
 */
const UNDELIVERABLE_CODES = new Set([
  // Not a WhatsApp user.
  "131026",
  // Recipient cannot receive messages from this business.
  "131047",
  "131052",
]);

export async function deactivateUndeliverable(
  updates: WhatsAppStatusUpdate[],
): Promise<number> {
  const deadIds = updates
    .filter((u) => u.status === "failed")
    .filter((u) => {
      const { code } = readError(u.errors);
      return code !== undefined && UNDELIVERABLE_CODES.has(code);
    })
    .map((u) => u.id);

  if (deadIds.length === 0) return 0;

  // The log row carries the device id the send targeted, so the number is
  // resolved through it rather than by re-parsing the phone from the
  // callback (which reports the recipient in a different format).
  const rows = await db
    .select({ deviceId: notificationLog.deviceId })
    .from(notificationLog)
    .where(
      and(
        inArray(notificationLog.providerMessageId, deadIds),
        eq(notificationLog.channel, "whatsapp"),
      ),
    );

  const deviceIds = rows
    .map((r) => r.deviceId)
    .filter((id): id is string => id !== null);

  if (deviceIds.length === 0) return 0;

  log.warn({
    event: "whatsapp.devices.undeliverable",
    channel: "whatsapp",
    count: deviceIds.length,
  });

  return deviceIds.length;
}
