import { db } from "@mumzo/db";
import {
  notificationLog,
  staffDevice,
  userDevice,
} from "@mumzo/db/schema/notifications";
import { and, eq, inArray } from "drizzle-orm";

import { getAdapter } from "../channels";
import { renderTemplate } from "../templates";
import { toNotificationApp } from "./apps";
import { log } from "./log";
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
  app: string;
};

/** Pulls the provider's own error code off a failure, so failures can be
 * grouped by cause without matching on message text. */
function errorCodeOf(error: unknown): string | undefined {
  if (error && typeof error === "object" && "code" in error) {
    return String((error as { code: unknown }).code);
  }
  return undefined;
}

/** Runs one notification job to completion: render once per channel, fan
 * out to every active device the recipient has, log every attempt. Never
 * throws for a single device's send failure — only a template/data bug
 * propagates (the queue retries the whole job on that, which is correct:
 * it'll fail the same way every time until the bug is fixed, so retrying is
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
    // Worth a line: "the push never arrived" is far more often no
    // registered device than a delivery failure, and without this the job
    // completes leaving no trace of why nothing was sent.
    log.warn({
      event: "dispatch.no_devices",
      templateId: job.templateId,
      userId: job.userId,
      audience,
    });
    return;
  }

  log.info({
    event: "dispatch.started",
    templateId: job.templateId,
    userId: job.userId,
    audience,
    count: devices.length,
  });

  const outcomes = await sendToDevices(job, devices);

  // One multi-row INSERT for the whole job rather than one per device: a
  // broadcast fan-out would otherwise issue a separate round-trip (and a
  // separate index update on every `notification_log` index) for each
  // device it touches.
  const recipientColumn =
    audience === "staff" ? { staffUserId: job.userId } : { userId: job.userId };

  await db.insert(notificationLog).values(
    outcomes.map((outcome) => ({
      ...recipientColumn,
      templateId: job.templateId,
      channel: outcome.channel,
      app: outcome.app,
      deviceId: outcome.deviceId,
      // "sent" = the provider accepted it. Actual receipt is only ever
      // confirmed out-of-band, which is what `delivered` is reserved for.
      status: outcome.result.ok ? "sent" : "failed",
      providerMessageId: outcome.result.ok
        ? outcome.result.providerMessageId
        : undefined,
      error: outcome.result.ok ? undefined : outcome.result.error,
      errorCode: outcome.result.ok ? undefined : outcome.errorCode,
    })),
  );

  // Per-device outcome lines, so a "why didn't this arrive" question can be
  // answered from logs alone without querying the DB.
  for (const outcome of outcomes) {
    if (outcome.result.ok) {
      log.info({
        event: "notification.sent",
        templateId: job.templateId,
        userId: job.userId,
        audience,
        channel: outcome.channel,
        app: outcome.app,
        deviceId: outcome.deviceId,
        providerMessageId: outcome.result.providerMessageId,
      });
      continue;
    }

    log.error({
      event: "notification.failed",
      templateId: job.templateId,
      userId: job.userId,
      audience,
      channel: outcome.channel,
      app: outcome.app,
      deviceId: outcome.deviceId,
      errorCode: outcome.errorCode,
      permanent: outcome.result.permanent,
      error: outcome.result.error,
    });
  }

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

    log.warn({
      event: "devices.deactivated",
      templateId: job.templateId,
      userId: job.userId,
      audience,
      count: deadDeviceIds.length,
    });
  }
}

type SendOutcome = {
  deviceId: string;
  channel: Channel;
  app: string;
  /** Provider error code, when the failure carried one. */
  errorCode?: string;
  result: SendResult;
};

/**
 * Sends one notification to every device, grouped by channel so an adapter
 * with a batch API (FCM's `sendEach`, 500 tokens per call) is used once per
 * channel instead of once per device.
 *
 * Results are re-associated with their originating device by position
 * within each channel group — `sendMany` guarantees input order — because
 * the caller deactivates rows by id and a mismatch here would unsubscribe
 * the wrong device.
 */
async function sendToDevices(
  job: NotificationJobPayload,
  devices: DeviceRow[],
): Promise<SendOutcome[]> {
  const byChannel = new Map<Channel, DeviceRow[]>();

  for (const device of devices) {
    const channel = device.channel as Channel;
    const group = byChannel.get(channel);
    if (group) {
      group.push(device);
    } else {
      byChannel.set(channel, [device]);
    }
  }

  const groups = await Promise.all(
    [...byChannel].map(([channel, group]) =>
      sendChannelGroup(job, channel, group),
    ),
  );

  return groups.flat();
}

async function sendChannelGroup(
  job: NotificationJobPayload,
  channel: Channel,
  devices: DeviceRow[],
): Promise<SendOutcome[]> {
  const adapter = getAdapter(channel);

  // No batch API, or nothing to batch — the per-device path is equivalent
  // and avoids paying for a grouped call with a single member.
  if (!adapter.sendMany || devices.length === 1) {
    return Promise.all(devices.map((device) => sendToDevice(job, device)));
  }

  try {
    const rendered = renderTemplate(job.templateId, channel, job.data);

    const results = await adapter.sendMany(
      rendered,
      devices.map((device) => ({
        id: device.id,
        userId: job.userId,
        channel,
        token: device.token,
        app: toNotificationApp(device.app),
      })),
    );

    return devices.map((device, index) => {
      const result = results[index] ?? {
        ok: false as const,
        error: "Adapter returned no result for this device",
        permanent: false,
      };

      return {
        deviceId: device.id,
        channel,
        app: device.app,
        errorCode: result.ok ? undefined : result.errorCode,
        result,
      };
    });
  } catch (error) {
    // A render or whole-batch failure is not any single device's fault.
    return devices.map((device) => ({
      deviceId: device.id,
      channel,
      app: device.app,
      errorCode: errorCodeOf(error),
      result: {
        ok: false as const,
        error: error instanceof Error ? error.message : "Unknown send error",
        permanent: false,
      },
    }));
  }
}

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
      app: toNotificationApp(device.app),
    });

    return {
      deviceId: device.id,
      channel,
      app: device.app,
      errorCode: result.ok ? undefined : result.errorCode,
      result,
    };
  } catch (error) {
    return {
      deviceId: device.id,
      channel,
      app: device.app,
      errorCode: errorCodeOf(error),
      result: {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown send error",
        permanent: false,
      },
    };
  }
}
