import { db } from "@mumzo/db";
import { staffDevice } from "@mumzo/db/schema/notifications";
import { eq } from "drizzle-orm";

import { getTemplate } from "../templates";
import { getNotificationQueue } from "./queue";
import type { NotificationJobInput } from "./types";

/**
 * Enqueues a notification — never blocks the caller on delivery. Validates
 * `data` against the template's schema up front so a bad call fails
 * immediately at the call site, not silently inside the worker.
 */
export async function send(input: NotificationJobInput) {
  const template = getTemplate(input.templateId);
  template.dataSchema.parse(input.data);

  await getNotificationQueue().add(input.templateId, input);
}

/**
 * Fans out a staff-audience notification to every staff member with at
 * least one active device — there is no hub/team assignment on staff yet
 * (see `packages/db/src/schema/staff.ts`), so "all staff" is the only
 * audience today. One job per recipient, so a single staff member's
 * delivery failure/retry never affects another's.
 */
export async function sendToAllStaff(
  templateId: string,
  data: unknown,
): Promise<void> {
  const recipients = await db
    .selectDistinct({ staffUserId: staffDevice.staffUserId })
    .from(staffDevice)
    .where(eq(staffDevice.isActive, true));

  await Promise.all(
    recipients.map((r) =>
      send({ userId: r.staffUserId, templateId, data, audience: "staff" }),
    ),
  );
}
