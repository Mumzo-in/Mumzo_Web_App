import { apiRequest } from "@/core/api/client";

/**
 * Notification registry + playground, against
 * `/api/v1/admin/notifications/*`. Real endpoints, not mock data — the
 * point of the playground is to exercise the production send path.
 */

export type RegisteredDevice = {
  id: string;
  audience: "staff" | "customer";
  ownerId: string;
  ownerName: string | null;
  ownerEmail: string | null;
  deviceId: string;
  channel: string;
  platform: string;
  app: string;
  tokenPreview: string;
  isActive: boolean;
  lastSeenAt: string;
  createdAt: string;
};

export type TemplateField = {
  name: string;
  type: string;
  optional: boolean;
  /** Key required, value may be null — distinct from optional. */
  nullable: boolean;
};

export type TemplateInfo = {
  id: string;
  audience: "staff" | "customer";
  fields: TemplateField[];
  preview: { title: string; body: string; deeplink: string | null };
};

export type NotificationLogEntry = {
  id: string;
  templateId: string;
  channel: string;
  app: string;
  status: string;
  providerMessageId: string | null;
  error: string | null;
  errorCode: string | null;
  deviceId: string | null;
  createdAt: string;
};

export function fetchDevices(includeInactive: boolean) {
  return apiRequest<RegisteredDevice[]>("/notifications/devices", {
    query: { audience: "all", includeInactive: String(includeInactive) },
  });
}

export function fetchTemplates() {
  return apiRequest<TemplateInfo[]>("/notifications/templates");
}

export function fetchLogs(limit = 25) {
  return apiRequest<NotificationLogEntry[]>("/notifications/logs", {
    query: { limit },
  });
}

export function sendTestNotification(input: {
  deviceId?: string;
  templateId: string;
  data: Record<string, unknown>;
}) {
  return apiRequest<{ queued: boolean; message: string }>(
    "/notifications/test-send",
    { method: "POST", body: input },
  );
}
