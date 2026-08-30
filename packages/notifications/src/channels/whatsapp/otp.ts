import { db } from "@mumzo/db";
import { otpAttempt } from "@mumzo/db/schema/auth";
import { and, eq, sql } from "drizzle-orm";

import { log } from "../../core/log";
import { normalisePhone, sendTemplateMessage } from "./client";
import {
  toPositionalParams,
  WHATSAPP_TEMPLATE,
  type WhatsAppTemplateDefinition,
} from "./templates";

/**
 * OTP delivery over WhatsApp.
 *
 * Deliberately **not** queued, unlike every other notification. The queue
 * exists to decouple slow, retryable, best-effort sends from the request
 * that triggered them — and an OTP is none of those things:
 *
 * - It blocks a user staring at a code entry screen, so it must be
 *   synchronous; a job claimed 200ms later is 200ms of someone waiting.
 * - It is not retryable in any useful sense. A code that arrives after
 *   the user has already requested another is worse than no code at all.
 * - Failure must reach the caller, so the UI can say "we couldn't send a
 *   code" instead of showing a code-entry box for a code that will never
 *   arrive.
 *
 * It shares the client, template catalogue, and logging with the queued
 * path — only the delivery mechanism differs.
 */

/**
 * Rate limits, chosen to stop abuse without breaking legitimate retries:
 * a customer who mistypes a number, or whose first message is slow, will
 * reasonably ask again once or twice.
 *
 * Enforced per phone number *and* per IP — the first stops someone
 * hammering one victim's number (each send costs money and annoys them),
 * the second stops one host cycling through many numbers.
 */
const LIMITS = {
  perPhone: { max: 5, windowMinutes: 60 },
  perIp: { max: 20, windowMinutes: 60 },
} as const;

/** How long attempt rows are kept — the longest window, plus slack. */
const RETENTION_MINUTES = 120;

export type OtpSendResult =
  | { ok: true; providerMessageId: string }
  | {
      ok: false;
      reason: "rate_limited" | "not_configured" | "send_failed";
      message: string;
    };

/**
 * A "N minutes ago" cutoff evaluated by Postgres.
 *
 * Every time comparison here goes through this rather than a JS `Date`:
 * `created_at` is `timestamp` without a time zone, so a bound `Date` is
 * read as local wall-clock and the comparison silently shifts by the
 * server's UTC offset. In IST that skewed the window by 5.5 hours —
 * enough to let the rate limit through and to make the retention sweep
 * delete live rows.
 */
function cutoff(minutes: number) {
  return sql.raw(`now() - interval '${minutes} minutes'`);
}

/**
 * Checks both limits before sending. Returns the reason when blocked so
 * the caller can distinguish "slow down" from "we broke".
 */
async function checkRateLimit(
  phone: string,
  ipAddress?: string,
): Promise<{ allowed: true } | { allowed: false; message: string }> {
  const [phoneCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(otpAttempt)
    .where(
      and(
        eq(otpAttempt.phoneNumber, phone),
        sql`${otpAttempt.createdAt} >= ${cutoff(LIMITS.perPhone.windowMinutes)}`,
      ),
    );

  if ((phoneCount?.count ?? 0) >= LIMITS.perPhone.max) {
    return {
      allowed: false,
      message: "Too many code requests for this number. Try again in an hour.",
    };
  }

  if (ipAddress) {
    const [ipCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(otpAttempt)
      .where(
        and(
          eq(otpAttempt.ipAddress, ipAddress),
          sql`${otpAttempt.createdAt} >= ${cutoff(LIMITS.perIp.windowMinutes)}`,
        ),
      );

    if ((ipCount?.count ?? 0) >= LIMITS.perIp.max) {
      return {
        allowed: false,
        message: "Too many code requests. Try again later.",
      };
    }
  }

  return { allowed: true };
}

/**
 * Sends a verification code over WhatsApp.
 *
 * The attempt is recorded *before* the send, not after: a provider call
 * that times out still consumed the resource the limit protects, and
 * recording only successes would let a caller retry a failing send without
 * bound.
 */
export async function sendOtpViaWhatsApp(input: {
  phoneNumber: string;
  code: string;
  ipAddress?: string;
}): Promise<OtpSendResult> {
  const phone = normalisePhone(input.phoneNumber);

  if (!phone) {
    return {
      ok: false,
      reason: "send_failed",
      message: `"${input.phoneNumber}" is not a usable phone number`,
    };
  }

  const definition: WhatsAppTemplateDefinition = WHATSAPP_TEMPLATE.LOGIN_OTP;

  // Widened to the shared definition type on purpose: `as const` narrows
  // `status` to today's literal, which would make this guard a
  // compile-time tautology and silently stop protecting anything the
  // moment the template is resubmitted.
  if (definition.status !== "approved") {
    // Fails loudly rather than silently doing nothing: an unapproved OTP
    // template means nobody can log in, which must not look like a
    // working flow.
    return {
      ok: false,
      reason: "not_configured",
      message: `WhatsApp OTP template "${definition.name}" is ${definition.status}, not approved.`,
    };
  }

  const limit = await checkRateLimit(phone, input.ipAddress);
  if (!limit.allowed) {
    log.warn({
      event: "otp.rate_limited",
      channel: "whatsapp",
    });
    return { ok: false, reason: "rate_limited", message: limit.message };
  }

  await db.insert(otpAttempt).values({
    phoneNumber: phone,
    ipAddress: input.ipAddress ?? null,
  });

  const result = await sendTemplateMessage({
    phone,
    templateName: definition.name,
    language: definition.language,
    parameters: toPositionalParams("LOGIN_OTP", { code: input.code }),
    // Authentication templates carry a copy-code button whose parameter
    // repeats the code itself.
    buttonParameters: [input.code],
    buttonIndex: 0,
  });

  if (!result.ok) {
    log.error({
      event: "otp.send_failed",
      channel: "whatsapp",
      errorCode: result.code ?? `http_${result.status}`,
      error: result.error,
    });
    return {
      ok: false,
      reason: "send_failed",
      message: "Could not send the verification code. Please try again.",
    };
  }

  log.info({
    event: "otp.sent",
    channel: "whatsapp",
    providerMessageId: result.messageId,
  });

  return { ok: true, providerMessageId: result.messageId };
}

/**
 * Discards attempt rows older than the retention window. Called from the
 * notification worker's existing sweep rather than on its own timer.
 */
export async function sweepOtpAttempts(): Promise<number> {
  const deleted = await db
    .delete(otpAttempt)
    .where(sql`${otpAttempt.createdAt} < ${cutoff(RETENTION_MINUTES)}`)
    .returning({ id: otpAttempt.id });

  return deleted.length;
}
