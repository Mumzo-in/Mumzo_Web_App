import { db } from "@mumzo/db";
import {
  notificationLog,
  staffDevice,
  userDevice,
} from "@mumzo/db/schema/notifications";
import { and, eq } from "drizzle-orm";

import { getAdapter } from "../channels";
import { renderTemplate } from "../templates";
import type { Audience, NotificationJobPayload } from "./types";

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

  await Promise.all(
    devices.map((device) => sendToDevice(job, audience, device)),
  );
}

async function sendToDevice(
  job: NotificationJobPayload,
  audience: Audience,
  device: DeviceRow,
) {
  const channel = device.channel as "fcm" | "web-push";
  const rendered = renderTemplate(job.templateId, channel, job.data);
  const adapter = getAdapter(channel);

  const result = await adapter.send(rendered, {
    id: device.id,
    userId: job.userId,
    channel,
    token: device.token,
  });

  const recipientColumn =
    audience === "staff" ? { staffUserId: job.userId } : { userId: job.userId };

  if (result.ok) {
    await db.insert(notificationLog).values({
      ...recipientColumn,
      templateId: job.templateId,
      channel,
      status: "sent",
      providerMessageId: result.providerMessageId,
    });
    return;
  }

  await db.insert(notificationLog).values({
    ...recipientColumn,
    templateId: job.templateId,
    channel,
    status: "failed",
    error: result.error,
  });

  if (result.permanent) {
    const table = audience === "staff" ? staffDevice : userDevice;
    await db
      .update(table)
      .set({ isActive: false })
      .where(eq(table.id, device.id));
  }
}
