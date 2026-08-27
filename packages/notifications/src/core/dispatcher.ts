import { db } from "@mumzo/db";
import {
  notificationLog,
  staffDevice,
  userDevice,
} from "@mumzo/db/schema/notifications";
import { and, eq, inArray } from "drizzle-orm";

import { getAdapter } from "../channels";
import { renderTemplate } from "../templates";
import type {
  Audience,
  Channel,
  NotificationJobPayload,
  SendResult,
} from "./types";

/** A device row shape common to `userDevice` and `staffDevice` — the two
 * tables are structurally identical (see notifications.ts schema comments
 * on why they're separate tables rather than one with a discriminator). */
type DeviceRow = {
  id: string;
  channel: string;
  token: string;
  isActive: boolean;
};

/** Runs one notification job to completion: render once per channel, fan
 * out to every active device the recipient has, log every attempt. Never
 * throws for a single device's send failure — only a template/data bug
 * propagates (BullMQ retries the whole job on that, which is correct: it'll
 * fail the same way every time until the bug is fixed, so retrying is
 * cheap and the job eventually lands in the dead-letter queue for
 * visibility). */
export async function processNotificationJob(job: NotificationJobPayload) {
  const audience: Audience = job.audience ?? "customer";
  const devices =
    audience === "staff"
      ? await db
          .select()
          .from(staffDevice)
          .where(
            and(
              eq(staffDevice.staffUserId, job.userId),
              eq(staffDevice.isActive, true),
            ),
          )
      : await db
          .select()
          .from(userDevice)
          .where(
            and(
              eq(userDevice.userId, job.userId),
              eq(userDevice.isActive, true),
            ),
          );

  if (devices.length === 0) {
    return;
  }

  const outcomes = await Promise.all(
    devices.map((device) => sendToDevice(job, device)),
  );

  // One multi-row INSERT for the whole job rather than one per device: a
  // broadcast fan-out would otherwise issue a separate round-trip (and a
  // separate index update on all three `notification_log` indexes) for
  // every device it touches.
  const recipientColumn =
    audience === "staff" ? { staffUserId: job.userId } : { userId: job.userId };

  await db.insert(notificationLog).values(
    outcomes.map((outcome) => ({
      ...recipientColumn,
      templateId: job.templateId,
      channel: outcome.channel,
      status: outcome.result.ok ? "sent" : "failed",
      providerMessageId: outcome.result.ok
        ? outcome.result.providerMessageId
        : undefined,
      error: outcome.result.ok ? undefined : outcome.result.error,
    })),
  );

  // Dead tokens are deactivated in one statement per table for the same
  // reason — `permanent` failures cluster (an expired FCM project, a
  // browser that dropped every subscription), so this is rarely one row.
  const deadDeviceIds = outcomes
    .filter((outcome) => !outcome.result.ok && outcome.result.permanent)
    .map((outcome) => outcome.deviceId);

  if (deadDeviceIds.length > 0) {
    const table = audience === "staff" ? staffDevice : userDevice;
    await db
      .update(table)
      .set({ isActive: false })
      .where(inArray(table.id, deadDeviceIds));
  }
}

type SendOutcome = {
  deviceId: string;
  channel: Channel;
  result: SendResult;
};

/** Sends to one device and reports what happened — deliberately does no DB
 * work of its own so the caller can batch every device's result into a
 * single write. Never throws: an adapter blowing up is recorded as a
 * non-permanent failure so one dead device can't fail the whole job. */
async function sendToDevice(
  job: NotificationJobPayload,
  device: DeviceRow,
): Promise<SendOutcome> {
  const channel = device.channel as Channel;

  try {
    const rendered = renderTemplate(job.templateId, channel, job.data);
    const adapter = getAdapter(channel);

    const result = await adapter.send(rendered, {
      id: device.id,
      userId: job.userId,
      channel,
      token: device.token,
    });

    return { deviceId: device.id, channel, result };
  } catch (error) {
    return {
      deviceId: device.id,
      channel,
      result: {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown send error",
        permanent: false,
      },
    };
  }
}
