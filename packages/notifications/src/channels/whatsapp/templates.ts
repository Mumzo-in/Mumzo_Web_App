/**
 * The approved WhatsApp template catalogue.
 *
 * A WhatsApp send is not a rendered title/body like FCM — it names an
 * approved template and supplies **positional** parameters that Meta
 * substitutes into `{{1}}`, `{{2}}`, … So the two things that must never
 * drift are the template's `name` and the *order* of its parameters, and
 * neither can be recovered by listing templates from the provider: the
 * listing gives you the body text, not which of your domain values belongs
 * in which slot. Hence this file rather than a runtime fetch.
 *
 * Kept deliberately as data (no send logic) so it can be diffed against
 * Meta's console during review, and so a template whose approval status
 * changes is a one-line edit here.
 */

/**
 * Meta's template categories. This is not cosmetic — it decides
 * deliverability:
 *
 * - `utility` — tied to an existing transaction, deliverable any time.
 * - `authentication` — OTP only, fixed copy, must carry a code button.
 * - `marketing` — **blocked outside the 24-hour customer service window**
 *   unless the recipient opted in. A marketing template used for a
 *   transactional event will silently fail to reach most recipients.
 */
export type WhatsAppTemplateCategory =
  | "utility"
  | "authentication"
  | "marketing";

/**
 * Where a template stands with Meta. Sends against anything other than
 * `approved` are refused before they reach the provider — a rejected or
 * still-in-review template returns an opaque error at send time, which is
 * a poor place to discover it.
 */
export type WhatsAppTemplateStatus =
  | "approved"
  | "in_review"
  | "rejected"
  | "not_submitted";

export type WhatsAppTemplateDefinition = {
  /** Exact template name as registered with Meta. */
  readonly name: string;
  /** Language code the template was approved under. Note "en" and "en_US"
   * are *different* templates to Meta and do not fall back to each other. */
  readonly language: string;
  readonly category: WhatsAppTemplateCategory;
  readonly status: WhatsAppTemplateStatus;
  /**
   * Ordered parameter names, matching `{{1}}`, `{{2}}`, … Used to build
   * the positional array from a named object, so call sites read
   * `{ customerName, orderId }` instead of `["Priya", "A3F9C1D2"]` — the
   * latter being trivially easy to transpose without any type error.
   */
  readonly params: readonly string[];
  /**
   * Ordered parameters for a dynamic URL button's `{{1}}`, when the
   * template has one. Buttons carry their own parameter sequence,
   * independent of the body's.
   */
  readonly buttonParams?: readonly string[];
  /** Why this template exists / what fires it. */
  readonly description: string;
};

/**
 * Every template, keyed by a stable code-facing id.
 *
 * The key is what code refers to; `name` is what Meta knows. They are
 * allowed to diverge — resubmitting a template under a new name (which is
 * required when adding buttons, since approved templates cannot gain them)
 * changes `name` only, leaving call sites untouched.
 */
export const WHATSAPP_TEMPLATE = {
  // ---------------------------------------------------------------- order

  ORDER_CONFIRMED: {
    name: "order_confirmation",
    language: "en",
    category: "utility",
    status: "in_review",
    params: ["customerName", "orderId", "items", "total", "address"],
    description: "Order placed and confirmed.",
  },

  ORDER_PACKED: {
    name: "order_packed",
    language: "en",
    category: "utility",
    status: "in_review",
    params: ["customerName", "orderId"],
    description: "Order packed, awaiting a rider.",
  },

  /**
   * Not yet submitted. The highest-value message in the set (rider name +
   * ETA), and deliberately *not* mapped onto the stock
   * `order_delivery_update` sample, which carries neither.
   */
  ORDER_OUT_FOR_DELIVERY: {
    name: "order_out_for_delivery",
    language: "en",
    category: "utility",
    status: "not_submitted",
    params: ["customerName", "orderId", "riderName", "etaMinutes"],
    description: "Rider is on the way, with ETA.",
  },

  ORDER_DELIVERED: {
    name: "order_delivered",
    language: "en",
    category: "utility",
    status: "in_review",
    params: ["orderId", "deliveredAt"],
    description: "Delivery completed successfully.",
  },

  ORDER_DELIVERY_FAILED: {
    name: "order_delivery_failed",
    language: "en",
    category: "utility",
    status: "in_review",
    params: ["customerName", "orderId", "reason"],
    description: "Delivery attempt failed.",
  },

  ORDER_CANCELLED: {
    name: "order_cancelled",
    language: "en",
    category: "utility",
    status: "in_review",
    // `reason` sits mid-sentence in the approved copy: Meta rejects empty
    // parameters at send time, so callers must pass a fallback sentence
    // rather than "" when no reason was given.
    params: ["orderId", "reason"],
    description: "Order cancelled by customer or staff.",
  },

  ORDER_REFUND_PROCESSED: {
    name: "order_refund_processed",
    language: "en",
    category: "utility",
    status: "in_review",
    params: ["amount", "orderId", "refundMethod", "workingDays"],
    description: "Refund issued for a cancelled or returned order.",
  },

  // --------------------------------------------------------------- return

  RETURN_REQUESTED: {
    name: "return_requested",
    language: "en",
    category: "utility",
    status: "in_review",
    params: ["orderId", "reviewHours"],
    description: "Return request received.",
  },

  RETURN_APPROVED: {
    name: "return_approved",
    language: "en",
    category: "utility",
    status: "in_review",
    params: ["orderId", "items", "pickupSlot", "refundAmount"],
    description: "Return approved with a pickup slot.",
  },

  // ------------------------------------------------------------- lifecycle

  REFERRAL_REWARD_EARNED: {
    name: "referral_reward_earned",
    language: "en",
    category: "utility",
    status: "in_review",
    // Mirrors `referral.coupon_issued`, which carries tier + amount only —
    // there is no friend name or coupon code available at that call site.
    params: ["customerName", "tierName", "amount"],
    description: "Referral tier unlocked and coupon issued.",
  },

  /**
   * Approved as **marketing**, not utility — so it will not deliver
   * outside the 24-hour window without opt-in, even though it is fired by
   * a transactional event. Worth resubmitting with utility-safe wording.
   */
  REVIEW_REQUEST: {
    name: "review_request",
    language: "en",
    category: "marketing",
    status: "in_review",
    params: ["customerName"],
    description: "Post-delivery rating prompt.",
  },

  /**
   * Not yet submitted. Meta supplies the copy for authentication
   * templates; the code is both the body parameter and the copy-code
   * button parameter, so it appears in `params` and `buttonParams`.
   */
  LOGIN_OTP: {
    name: "mumzo_login_otp",
    language: "en",
    category: "authentication",
    status: "not_submitted",
    params: ["code"],
    buttonParams: ["code"],
    description: "Phone login / signup verification code.",
  },

  // -------------------------------------------------------------- marketing

  CART_ABANDONED: {
    name: "cart_abandoned",
    language: "en",
    category: "marketing",
    status: "in_review",
    params: ["customerName", "items"],
    description: "Abandoned cart nudge. Requires opt-in.",
  },

  BACK_IN_STOCK: {
    name: "back_in_stock",
    language: "en",
    category: "marketing",
    status: "in_review",
    params: ["customerName", "productName"],
    description: "Watched product restocked. Requires opt-in.",
  },

  /**
   * The generic campaign slot — one flexible template beats submitting a
   * new one per campaign. The whole message body is a single parameter.
   */
  PROMO_BROADCAST: {
    name: "promo_broadcast",
    language: "en",
    category: "marketing",
    status: "in_review",
    params: ["message"],
    description: "Generic marketing broadcast. Requires opt-in.",
  },
} as const satisfies Record<string, WhatsAppTemplateDefinition>;

/** Code-facing template keys — `WHATSAPP_TEMPLATE.ORDER_PACKED` etc. */
export type WhatsAppTemplateKey = keyof typeof WHATSAPP_TEMPLATE;

/**
 * The named-parameter object a given template expects, derived from its
 * own `params` tuple — so passing `{ orderId }` to a template that also
 * needs `customerName` is a compile error, not a malformed message.
 */
export type WhatsAppTemplateParams<K extends WhatsAppTemplateKey> = {
  [P in (typeof WHATSAPP_TEMPLATE)[K]["params"][number]]: string | number;
};

/**
 * Converts named params into the positional array Meta expects.
 *
 * Values are stringified here (Meta accepts only strings) and checked for
 * emptiness: an empty parameter is rejected by the API at send time, which
 * surfaces as an opaque provider error far from the call site that omitted
 * it.
 */
export function toPositionalParams<K extends WhatsAppTemplateKey>(
  key: K,
  params: WhatsAppTemplateParams<K>,
): string[] {
  const definition = WHATSAPP_TEMPLATE[key];
  const record = params as Record<string, string | number>;

  return definition.params.map((name) => {
    const value = record[name];
    const text = typeof value === "number" ? String(value) : (value ?? "");

    if (text.trim() === "") {
      throw new Error(
        `WhatsApp template "${definition.name}" parameter "${name}" is empty — Meta rejects blank parameters. Pass a fallback string instead.`,
      );
    }

    return text;
  });
}

/**
 * Whether a template can actually be sent right now. Checked before
 * dispatch so an unapproved template fails with a readable reason rather
 * than an opaque provider error.
 */
export function isSendable(key: WhatsAppTemplateKey): boolean {
  return (
    (WHATSAPP_TEMPLATE[key].status as WhatsAppTemplateStatus) === "approved"
  );
}
