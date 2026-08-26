import { env } from "@mumzo/env/web";
import type { DeliveryOutcome, DeliveryRun } from "../data/delivery-data";

/**
 * Delivery-link API — the public rider surface.
 *
 * These are the only calls in the admin app that are *unauthenticated*: they
 * hit `/api/v1/delivery/*` rather than `/api/v1/admin/*`, because a rider is
 * not a staff user and has no session. The URL token addresses the delivery
 * and the rider's own access code authorises it, so the code is sent with
 * every request (and always in the body, never the query string).
 */

type Envelope<T> =
  | { success: true; data: T }
  | { success: false; error: { code: string; message: string } };

function apiBase(): string {
  const url = env.VITE_SERVER_URL ?? "";
  const trimmed = url.endsWith("/") ? url.slice(0, -1) : url;
  return `${trimmed}/api/v1/delivery`;
}

async function call<T>(path: string, body?: unknown): Promise<T> {
  const response = await fetch(`${apiBase()}${path}`, {
    method: body ? "POST" : "GET",
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });

  const payload = (await response.json()) as Envelope<T>;

  if (!payload.success) {
    throw new Error(payload.error.message);
  }
  return payload.data;
}

/** Whether the link is live — safe to call before any code is entered, and
 * deliberately returns no customer data. */
export type DeliveryLinkStatus = {
  token: string;
  locked: boolean;
  outcome: DeliveryOutcome | null;
  lockedOut: boolean;
};

export function getDeliveryLinkStatus(
  token: string,
): Promise<DeliveryLinkStatus> {
  return call<DeliveryLinkStatus>(`/${encodeURIComponent(token)}`);
}

/** Exchange the rider's code for the delivery details. */
export function unlockDeliveryRun(
  token: string,
  code: string,
): Promise<DeliveryRun> {
  return call<DeliveryRun>(`/${encodeURIComponent(token)}/unlock`, { code });
}

export type CompleteDeliveryInput = {
  token: string;
  code: string;
  outcome: DeliveryOutcome;
  reason?: string;
};

export function completeDeliveryRun({
  token,
  code,
  outcome,
  reason,
}: CompleteDeliveryInput): Promise<DeliveryRun> {
  return call<DeliveryRun>(`/${encodeURIComponent(token)}/outcome`, {
    code,
    outcome,
    reason,
  });
}

/** The URL ops shares with a rider. Absolute so it survives a paste into
 * WhatsApp. */
export function buildDeliveryLink(token: string): string {
  return `${window.location.origin}/delivery?token=${token}`;
}
