import type {
  ChannelAdapter,
  DeviceTarget,
  RenderedNotification,
  SendResult,
} from "../../core/types";
import { normalisePhone, sendTemplateMessage } from "./client";
import {
  isSendable,
  WHATSAPP_TEMPLATE,
  type WhatsAppTemplateKey,
} from "./templates";

/**
 * WhatsApp channel adapter.
 *
 * Runs through the same queue and worker as every other channel: a job is
 * claimed, the dispatcher groups its devices by channel, and this adapter
 * receives the `whatsapp` group. The device `token` here is a phone
 * number rather than a push token — the one place WhatsApp differs from
 * FCM at this layer.
 *
 * The template to send is carried on `payload.data.whatsappTemplate`
 * (a `WHATSAPP_TEMPLATE` key) with its positional parameters already
 * built by the notification template's `render`. That keeps the
 * FCM-shaped `RenderedNotification` contract intact — WhatsApp ignores
 * `title`/`body`, since Meta renders approved copy on its own side and
 * accepts only the variable slots.
 */

/**
 * HTTP statuses worth retrying. Everything else is treated as permanent.
 *
 * - `429` — rate limited; the queue's exponential backoff is exactly right.
 * - `409` — a send for this conversation is already in flight.
 * - `5xx` — provider-side fault.
 * - `0` — network failure or timeout, synthesised by the client.
 *
 * A `4xx` that isn't 429/409 means the request itself is wrong (bad
 * number, unapproved template, malformed parameters) and will fail
 * identically on every retry.
 */
function isRetryableStatus(status: number): boolean {
  return status === 0 || status === 429 || status === 409 || status >= 500;
}

/**
 * Meta error codes that mean "this number will never receive messages" —
 * the device row is deactivated rather than retried.
 *
 * Deliberately narrow: everything unlisted is treated as retryable, which
 * is the safe default. A transient fault wrongly called permanent
 * unsubscribes a real customer, while the reverse only wastes a few
 * retries before the job dies naturally.
 */
const PERMANENT_ERROR_CODES = new Set([
  // Not a WhatsApp user / invalid recipient.
  "131026",
  // Recipient blocked the business, or is otherwise undeliverable.
  "131047",
  "131052",
  // Message failed to send because the number is invalid.
  "131009",
]);

/** Text-matched permanent failures, for errors Kapso reports without a
 * numeric Meta code. */
function isPermanentMessage(message: string): boolean {
  const text = message.toLowerCase();
  return (
    text.includes("not a whatsapp user") ||
    text.includes("invalid phone") ||
    text.includes("recipient not found")
  );
}

function classify(result: {
  status: number;
  error: string;
  code?: string;
}): SendResult {
  const permanent =
    !isRetryableStatus(result.status) ||
    (result.code !== undefined && PERMANENT_ERROR_CODES.has(result.code)) ||
    isPermanentMessage(result.error);

  return {
    ok: false,
    error: result.error,
    errorCode: result.code ?? `http_${result.status}`,
    permanent,
  };
}

/** Reads the template key a notification template attached to its payload. */
function templateKeyOf(
  payload: RenderedNotification,
): WhatsAppTemplateKey | undefined {
  const key = payload.data?.whatsappTemplate;
  if (key && key in WHATSAPP_TEMPLATE) {
    return key as WhatsAppTemplateKey;
  }
  return undefined;
}

/**
 * Positional parameters travel as a JSON array in `data.whatsappParams`,
 * since `RenderedNotification.data` is a flat string map.
 */
function paramsOf(payload: RenderedNotification, field: string): string[] {
  const raw = payload.data?.[field];
  if (!raw) return [];

  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

async function send(
  payload: RenderedNotification,
  target: DeviceTarget,
): Promise<SendResult> {
  const key = templateKeyOf(payload);

  if (!key) {
    // A template that has no WhatsApp mapping should not have produced a
    // WhatsApp device target at all — permanent, since retrying renders
    // the same payload.
    return {
      ok: false,
      error: `notification has no WhatsApp template mapping (data.whatsappTemplate="${payload.data?.whatsappTemplate ?? ""}")`,
      errorCode: "no_template_mapping",
      permanent: true,
    };
  }

  const definition = WHATSAPP_TEMPLATE[key];

  if (!isSendable(key)) {
    // Not yet approved by Meta. Permanent for this job: approval takes
    // hours to days, far beyond the retry window, and sending would fail
    // with an opaque provider error anyway.
    return {
      ok: false,
      error: `WhatsApp template "${definition.name}" is ${definition.status}, not approved — send skipped.`,
      errorCode: "template_not_approved",
      permanent: true,
    };
  }

  const phone = normalisePhone(target.token);
  if (!phone) {
    return {
      ok: false,
      error: `"${target.token}" is not a usable phone number`,
      errorCode: "invalid_phone",
      permanent: true,
    };
  }

  // `as const satisfies` narrows each entry to its own literal type, so
  // `buttonParams` is absent from the union rather than optional on it.
  const hasButtonParams = "buttonParams" in definition;

  const buttonParameters = hasButtonParams
    ? paramsOf(payload, "whatsappButtonParams")
    : undefined;

  // Meta rejects the whole send with 131008 when a template's dynamic URL
  // button gets no parameter, so this is caught here with a readable
  // message rather than as an opaque provider error.
  if (hasButtonParams && !buttonParameters?.length) {
    return {
      ok: false,
      error: `WhatsApp template "${definition.name}" has a dynamic URL button but the render supplied no button parameter.`,
      errorCode: "missing_button_param",
      permanent: true,
    };
  }

  const result = await sendTemplateMessage({
    phone,
    templateName: definition.name,
    language: definition.language,
    parameters: paramsOf(payload, "whatsappParams"),
    buttonParameters,
    buttonIndex:
      "buttonIndex" in definition
        ? (definition.buttonIndex as number)
        : undefined,
  });

  if (result.ok) {
    return { ok: true, providerMessageId: result.messageId };
  }

  return classify(result);
}

export const whatsappAdapter: ChannelAdapter = {
  channel: "whatsapp",
  send,
  // No batch endpoint — Kapso sends one message per request, so the
  // dispatcher's concurrent `send()` fallback is the right behaviour.
};
