import { env } from "@mumzo/env/server";

/**
 * Kapso REST client.
 *
 * Deliberately a small hand-rolled fetch wrapper rather than
 * `@kapso/whatsapp-cloud-api`: that SDK targets Meta's Graph shape through
 * a proxy host (`api.kapso.ai/meta/whatsapp`) which currently 404s for this
 * account, while the working surface is Kapso's own REST API at
 * `app.kapso.ai/api/v1` with a different payload shape. Wrapping the two
 * endpoints we actually use is less code than adapting the SDK to an
 * endpoint it doesn't model.
 *
 * Shared by the notification worker and (later) the OTP path, so it holds
 * no per-send state.
 */

/** Kapso's template listing entry, narrowed to the fields we read. */
export type KapsoTemplate = {
  name: string;
  language_code: string;
  category: string;
  /** Kapso's own lifecycle: "submitted" | "approved" | "rejected". */
  status: string;
  parameter_count: number;
  business_account_id: string;
};

export type KapsoSendResult =
  | { ok: true; messageId: string }
  | { ok: false; status: number; error: string; code?: string };

function requireConfig() {
  if (!env.KAPSO_API_KEY) {
    throw new Error(
      "WhatsApp is not configured — set KAPSO_API_KEY (and WHATSAPP_PHONE_NUMBER_ID).",
    );
  }
  return { apiKey: env.KAPSO_API_KEY, baseUrl: env.KAPSO_BASE_URL };
}

/** Whether WhatsApp is configured at all. Lets the dispatcher skip the
 * channel cleanly in environments with no credentials rather than throwing
 * once per job. */
export function isWhatsAppConfigured(): boolean {
  return Boolean(env.KAPSO_API_KEY && env.WHATSAPP_PHONE_NUMBER_ID);
}

async function kapsoFetch(
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  const { apiKey, baseUrl } = requireConfig();

  return fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      "X-API-Key": apiKey,
      "Content-Type": "application/json",
      ...init.headers,
    },
    // A hung provider call must not hold a worker slot (and its pooled DB
    // connection) indefinitely — the job retries instead.
    signal: AbortSignal.timeout(15_000),
  });
}

/**
 * Normalises a phone number to the digits-only international form Kapso
 * expects.
 *
 * Mumzo stores Indian numbers inconsistently — `+91 62812 19022`,
 * `06281219022`, or a bare 10-digit string — and WhatsApp silently fails
 * on anything that isn't full international format, so this is applied to
 * every send rather than trusted from the DB.
 */
export function normalisePhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  if (digits.length < 10) return null;

  const cc = env.WHATSAPP_DEFAULT_COUNTRY_CODE;

  // Already international.
  if (digits.length > 10 && digits.startsWith(cc)) return digits;
  // Bare national number, optionally with a trunk "0".
  if (digits.length === 10) return `${cc}${digits}`;
  if (digits.length === 11 && digits.startsWith("0")) {
    return `${cc}${digits.slice(1)}`;
  }
  // Some other country's international number — pass through untouched.
  return digits;
}

/**
 * Sends an approved template message.
 *
 * `parameters` are positional, matching `{{1}}`, `{{2}}`, … — build them
 * with `toPositionalParams()` rather than by hand.
 */
export async function sendTemplateMessage(input: {
  phone: string;
  templateName: string;
  language: string;
  parameters: string[];
  /** Parameters for a dynamic URL button, when the template has one. */
  buttonParameters?: string[];
}): Promise<KapsoSendResult> {
  const components: Record<string, unknown>[] = [];

  if (input.parameters.length > 0) {
    components.push({
      type: "body",
      parameters: input.parameters.map((text) => ({ type: "text", text })),
    });
  }

  if (input.buttonParameters?.length) {
    components.push({
      type: "button",
      sub_type: "url",
      index: "0",
      parameters: input.buttonParameters.map((text) => ({
        type: "text",
        text,
      })),
    });
  }

  let response: Response;
  try {
    response = await kapsoFetch("/whatsapp_messages", {
      method: "POST",
      body: JSON.stringify({
        phone_number: input.phone,
        message: {
          type: "template",
          template: {
            name: input.templateName,
            language: { code: input.language },
            ...(components.length > 0 ? { components } : {}),
          },
        },
      }),
    });
  } catch (error) {
    // Network failure or timeout — no HTTP status exists, so it is
    // reported as 0 and classified as retryable upstream.
    return {
      ok: false,
      status: 0,
      error: error instanceof Error ? error.message : String(error),
    };
  }

  const text = await response.text();
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    parsed = { error: text.slice(0, 200) };
  }

  const body = parsed as {
    id?: string;
    messages?: { id?: string }[];
    error?: string | { message?: string; code?: number };
    message?: string;
    detail?: string;
  };

  if (!response.ok) {
    const raw = body.error ?? body.message ?? body.detail ?? text.slice(0, 200);
    const message = typeof raw === "string" ? raw : (raw?.message ?? "unknown");
    const code =
      typeof body.error === "object" && body.error?.code !== undefined
        ? String(body.error.code)
        : undefined;

    return { ok: false, status: response.status, error: message, code };
  }

  // Kapso echoes Meta's envelope on success; fall back to its own id.
  const messageId = body.messages?.[0]?.id ?? body.id;
  if (!messageId) {
    return {
      ok: false,
      status: response.status,
      error: "provider returned no message id",
    };
  }

  return { ok: true, messageId };
}

/**
 * Lists the account's templates. Used by the catalogue drift check rather
 * than at send time — a per-send lookup would add a round-trip to every
 * notification to re-learn something that changes a few times a month.
 */
export async function listTemplates(): Promise<KapsoTemplate[]> {
  const response = await kapsoFetch("/whatsapp_templates?per_page=100");

  if (!response.ok) {
    throw new Error(
      `Kapso template listing failed: ${response.status} ${await response.text()}`,
    );
  }

  const body = (await response.json()) as { data?: KapsoTemplate[] };
  return body.data ?? [];
}
