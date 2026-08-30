import {
  normalizeWebhook,
  verifySignature,
} from "@kapso/whatsapp-cloud-api/server";
import { env } from "@mumzo/env/server";
import {
  applyStatusUpdates,
  deactivateUndeliverable,
} from "@mumzo/notifications";

import { createRouter } from "../../core";

/**
 * WhatsApp delivery-status webhook.
 *
 * Mounted outside `/api/v1` because Meta calls one fixed URL that we
 * cannot version — the path is registered in the Meta/Kapso console and
 * changing it means reconfiguring there.
 *
 * Two verbs, as the platform requires:
 *
 * - `GET`  — the one-off subscription handshake, echoing `hub.challenge`.
 * - `POST` — the ongoing status callbacks.
 */
const whatsappWebhook = createRouter()
  /**
   * Subscription handshake. Meta calls this once when the webhook is
   * configured and expects the raw challenge string echoed back, with the
   * verify token matched exactly.
   */
  .get("/whatsapp", (c) => {
    const mode = c.req.query("hub.mode");
    const token = c.req.query("hub.verify_token");
    const challenge = c.req.query("hub.challenge");

    if (!env.WHATSAPP_WEBHOOK_VERIFY_TOKEN) {
      console.error("[whatsapp-webhook] WHATSAPP_WEBHOOK_VERIFY_TOKEN unset");
      return c.text("Webhook not configured", 500);
    }

    if (
      mode === "subscribe" &&
      token === env.WHATSAPP_WEBHOOK_VERIFY_TOKEN &&
      challenge
    ) {
      // Must be the bare challenge — any JSON wrapper fails the handshake.
      return c.text(challenge, 200);
    }

    return c.text("Forbidden", 403);
  })

  /**
   * Status callbacks.
   *
   * Always answers 200 once the signature checks out, even when
   * processing fails: Meta retries non-2xx responses with escalating
   * backoff and eventually disables the webhook, so a transient database
   * fault must not cost us the whole subscription. Failures are logged
   * instead.
   */
  .post("/whatsapp", async (c) => {
    if (!env.WHATSAPP_APP_SECRET) {
      // Refusing here is deliberate: without the secret we cannot tell a
      // real callback from a forged one, and accepting unsigned updates
      // would let anyone mark any message delivered — or failed.
      console.error("[whatsapp-webhook] WHATSAPP_APP_SECRET unset");
      return c.text("Webhook not configured", 500);
    }

    // The signature is computed over the exact bytes Meta sent, so the raw
    // body must be read before any JSON parsing re-serialises it.
    const rawBody = await c.req.text();
    const signatureHeader = c.req.header("x-hub-signature-256");

    if (
      !verifySignature({
        appSecret: env.WHATSAPP_APP_SECRET,
        rawBody,
        signatureHeader,
      })
    ) {
      console.warn("[whatsapp-webhook] rejected: bad signature");
      return c.text("Invalid signature", 401);
    }

    try {
      const payload: unknown = JSON.parse(rawBody);
      const { statuses } = normalizeWebhook(payload);

      if (statuses.length > 0) {
        const { matched, skipped } = await applyStatusUpdates(statuses);
        await deactivateUndeliverable(statuses);

        console.info(
          `[whatsapp-webhook] ${statuses.length} status update(s): ${matched} applied, ${skipped} skipped`,
        );
      }
    } catch (error) {
      // Swallowed on purpose — see the note above on Meta's retry
      // behaviour. The callback is lost, but the subscription survives.
      console.error("[whatsapp-webhook] processing failed:", error);
    }

    return c.body(null, 200);
  });

export default whatsappWebhook;
