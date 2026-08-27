import { db } from "@mumzo/db";
import { user } from "@mumzo/db/schema/auth";
import {
  notificationLog,
  staffDevice,
  userDevice,
} from "@mumzo/db/schema/notifications";
import { staffUser } from "@mumzo/db/schema/staff";
import {
  listTemplates,
  type NotificationTemplateId,
  notify,
  renderTemplate,
} from "@mumzo/notifications";
import { desc, eq } from "drizzle-orm";
import type { z } from "zod";

import { badRequest, notFound } from "@/core/errors";
import type {
  deviceListQuerySchema,
  registeredDeviceSchema,
  testSendSchema,
} from "./notifications.schema";

type RegisteredDevice = z.infer<typeof registeredDeviceSchema>;

/** Enough of a token to recognise which device a row is, without putting a
 * usable credential on screen. */
function previewToken(token: string): string {
  return `${token.slice(0, 16)}…${token.slice(-6)}`;
}

/**
 * Every registered push device, staff and customer, in one list.
 *
 * The two live in separate tables (distinct id spaces — see the schema
 * comments), so this is a union of two queries rather than a join, joined
 * to each audience's own identity table for a human-readable owner.
 */
export async function listDevices(
  query: z.infer<typeof deviceListQuerySchema>,
): Promise<RegisteredDevice[]> {
  const devices: RegisteredDevice[] = [];

  if (query.audience === "staff" || query.audience === "all") {
    const rows = await db
      .select({
        id: staffDevice.id,
        ownerId: staffDevice.staffUserId,
        ownerName: staffUser.name,
        ownerEmail: staffUser.email,
        deviceId: staffDevice.deviceId,
        channel: staffDevice.channel,
        platform: staffDevice.platform,
        app: staffDevice.app,
        token: staffDevice.token,
        isActive: staffDevice.isActive,
        lastSeenAt: staffDevice.lastSeenAt,
        createdAt: staffDevice.createdAt,
      })
      .from(staffDevice)
      .leftJoin(staffUser, eq(staffDevice.staffUserId, staffUser.id))
      .orderBy(desc(staffDevice.lastSeenAt));

    for (const row of rows) {
      if (!query.includeInactive && !row.isActive) continue;
      devices.push({
        ...row,
        audience: "staff",
        ownerName: row.ownerName ?? null,
        ownerEmail: row.ownerEmail ?? null,
        tokenPreview: previewToken(row.token),
        lastSeenAt: row.lastSeenAt.toISOString(),
        createdAt: row.createdAt.toISOString(),
      });
    }
  }

  if (query.audience === "customer" || query.audience === "all") {
    const rows = await db
      .select({
        id: userDevice.id,
        ownerId: userDevice.userId,
        ownerName: user.name,
        ownerEmail: user.email,
        deviceId: userDevice.deviceId,
        channel: userDevice.channel,
        platform: userDevice.platform,
        app: userDevice.app,
        token: userDevice.token,
        isActive: userDevice.isActive,
        lastSeenAt: userDevice.lastSeenAt,
        createdAt: userDevice.createdAt,
      })
      .from(userDevice)
      .leftJoin(user, eq(userDevice.userId, user.id))
      .orderBy(desc(userDevice.lastSeenAt));

    for (const row of rows) {
      if (!query.includeInactive && !row.isActive) continue;
      devices.push({
        ...row,
        audience: "customer",
        ownerName: row.ownerName ?? null,
        ownerEmail: row.ownerEmail ?? null,
        tokenPreview: previewToken(row.token),
        lastSeenAt: row.lastSeenAt.toISOString(),
        createdAt: row.createdAt.toISOString(),
      });
    }
  }

  return devices.sort((a, b) => b.lastSeenAt.localeCompare(a.lastSeenAt));
}

/** Sample values used to preview a template's copy. Keyed by field name
 * rather than per template, since the field vocabulary is small and
 * shared. */
const SAMPLE_VALUES: Record<string, unknown> = {
  orderId: "a1b2c3d4e5f6",
  total: 499,
  addressName: "Asha Sharma",
  hubId: "hub-hyderabad-1",
  status: "packed",
  fromStatus: "confirmed",
  toStatus: "packed",
  outcome: "delivered",
  riderName: "Ravi Kumar",
  reason: null,
  tierName: "Gold",
  amount: 100,
};

/**
 * Reads a template's Zod schema to discover its fields, so the playground
 * builds a form per template without hardcoding any of them. A template
 * added later shows up automatically.
 */
function describeFields(schema: unknown) {
  // Zod v4 exposes `shape` as a plain object; v3 exposed it as a thunk.
  // Both forms are handled so this doesn't silently return no fields (and
  // render an empty form) after a Zod upgrade.
  const raw = (
    schema as {
      _def?: { shape?: unknown };
      shape?: unknown;
    }
  )?._def?.shape;

  const shape = (typeof raw === "function" ? raw() : raw) as
    | Record<string, unknown>
    | undefined;

  if (!shape || typeof shape !== "object") return [];

  return Object.entries(shape).map(([name, field]) => {
    const inner = field as {
      _def?: { typeName?: string; type?: string; innerType?: unknown };
      type?: string;
    };

    // v4 stores the kind on `_def.type` ("string"/"number"), v3 on
    // `_def.typeName` ("ZodString").
    const typeName =
      inner?._def?.type ?? inner?._def?.typeName ?? inner?.type ?? "unknown";

    const normalised = String(typeName).replace(/^Zod/, "").toLowerCase();

    // "nullable" and "optional" are not interchangeable, and conflating
    // them breaks sends: a nullable field is still *required* — the key
    // must be present with an explicit null — whereas an optional one may
    // be omitted entirely. Reporting both as "optional" made the client
    // drop nullable keys and fail validation.
    const isOptional = normalised === "optional" || normalised === "default";

    return {
      name,
      type: normalised,
      optional: isOptional,
      nullable: normalised === "nullable",
    };
  });
}

/** Staff-facing templates are the `admin.*` ones plus `order.created`,
 * which is written for whoever is packing the order. */
function audienceOf(id: string): "staff" | "customer" {
  return id.startsWith("admin.") || id === "order.created"
    ? "staff"
    : "customer";
}

export function listTemplateInfo() {
  return listTemplates().map((template) => {
    let preview = { title: "", body: "", deeplink: null as string | null };

    // A template whose sample values don't satisfy its schema still needs
    // to appear in the picker — it just can't show a preview.
    try {
      const rendered = renderTemplate(template.id, "fcm", SAMPLE_VALUES);
      preview = {
        title: rendered.title,
        body: rendered.body,
        deeplink: rendered.deeplink ?? null,
      };
    } catch {
      preview = {
        title: "(preview unavailable)",
        body: "Sample data does not satisfy this template's schema.",
        deeplink: null,
      };
    }

    return {
      id: template.id,
      audience: audienceOf(template.id),
      fields: describeFields(template.dataSchema),
      preview,
    };
  });
}

/**
 * Sends a real notification through the real queue — deliberately not a
 * simulation. A playground that mocks the send would pass while the actual
 * path is broken, which is the opposite of what it's for.
 */
export async function sendTestNotification(
  staffUserId: string,
  input: z.infer<typeof testSendSchema>,
) {
  const templateId = input.templateId as NotificationTemplateId;

  // Targeting one device means addressing its owner, since the dispatcher
  // fans out per recipient rather than per device.
  if (input.deviceId) {
    const [staffRow] = await db
      .select()
      .from(staffDevice)
      .where(eq(staffDevice.id, input.deviceId))
      .limit(1);

    if (staffRow) {
      if (!staffRow.isActive) {
        throw badRequest(
          "That device is deactivated — its token was rejected as permanently invalid. Re-enable notifications in the browser to register a fresh one.",
        );
      }
      await notify.send({
        userId: staffRow.staffUserId,
        templateId,
        data: input.data,
        audience: "staff",
      });
      return {
        jobId: null,
        queued: true,
        message: `Queued for ${staffRow.platform}/${staffRow.app} device — every active device of that staff member will receive it.`,
      };
    }

    const [customerRow] = await db
      .select()
      .from(userDevice)
      .where(eq(userDevice.id, input.deviceId))
      .limit(1);

    if (!customerRow) throw notFound("Device");
    if (!customerRow.isActive) {
      throw badRequest("That device is deactivated and cannot receive sends.");
    }

    await notify.send({
      userId: customerRow.userId,
      templateId,
      data: input.data,
      audience: "customer",
    });
    return {
      jobId: null,
      queued: true,
      message: `Queued for ${customerRow.platform}/${customerRow.app} device — every active device of that customer will receive it.`,
    };
  }

  // No device chosen — send to whoever is testing.
  await notify.send({
    userId: staffUserId,
    templateId,
    data: input.data,
    audience: "staff",
  });

  return {
    jobId: null,
    queued: true,
    message: "Queued for your own registered devices.",
  };
}

/** Recent delivery attempts — the other half of the playground: send, then
 * see what the provider said about it. */
export async function listRecentLogs(limit: number) {
  const rows = await db
    .select()
    .from(notificationLog)
    .orderBy(desc(notificationLog.createdAt))
    .limit(limit);

  return rows.map((row) => ({
    id: row.id,
    templateId: row.templateId,
    channel: row.channel,
    app: row.app,
    status: row.status,
    providerMessageId: row.providerMessageId,
    error: row.error,
    errorCode: row.errorCode,
    deviceId: row.deviceId,
    createdAt: row.createdAt.toISOString(),
  }));
}
