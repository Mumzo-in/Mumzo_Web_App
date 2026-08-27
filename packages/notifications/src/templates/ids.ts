/**
 * Canonical template ids, as autocompletable constants rather than string
 * literals scattered across call sites.
 *
 * `NOTIFICATION_TEMPLATE.ORDER.NEW` is checked by the compiler; a typo in
 * `"order.crated"` is not, and would only surface as a thrown "Unknown
 * notification template" at send time — inside a queue worker, well away
 * from the code that caused it.
 *
 * Grouped by audience first, because that is the split that actually
 * matters when reading a call site: `ADMIN.*` goes to staff devices,
 * `ORDER.*`/`REFERRAL.*`/`REVIEW.*` to a customer's.
 *
 * The string values are the ids persisted in `notification_job.template_id`
 * and `notification_log.template_id`, so they are **not** safe to rename
 * casually — a rename orphans every queued and logged row carrying the old
 * value.
 */
export const NOTIFICATION_TEMPLATE = {
  /** Customer-facing order lifecycle. */
  ORDER: {
    /** New order placed — sent to staff, not the customer. */
    NEW: "order.created",
    /** Status moved (confirmed → packed → …), written for the customer. */
    STATUS_UPDATED: "order.status_updated",
  },

  /** Staff-facing dashboard events. */
  ADMIN: {
    /** Status moved, written for staff (shows the transition). */
    ORDER_STATUS_UPDATED: "admin.order.status_updated",
    /** A rider closed a delivery from the public delivery link. */
    DELIVERY_COMPLETED: "admin.delivery.completed",
  },

  /** Referral programme. */
  REFERRAL: {
    /** A referral settled and a reward coupon was issued. */
    COUPON_ISSUED: "referral.coupon_issued",
  },

  /** Post-delivery review prompts. */
  REVIEW: {
    /** The sweep decided this delivered order should ask for a rating. */
    PROMPT_REQUESTED: "review.prompt_requested",
  },
} as const;

/** Every registered template id, as a union — the type `notify.send()` and
 * `sendToAllStaff()` accept in place of a bare `string`. */
export type NotificationTemplateId =
  | (typeof NOTIFICATION_TEMPLATE)["ORDER"][keyof (typeof NOTIFICATION_TEMPLATE)["ORDER"]]
  | (typeof NOTIFICATION_TEMPLATE)["ADMIN"][keyof (typeof NOTIFICATION_TEMPLATE)["ADMIN"]]
  | (typeof NOTIFICATION_TEMPLATE)["REFERRAL"][keyof (typeof NOTIFICATION_TEMPLATE)["REFERRAL"]]
  | (typeof NOTIFICATION_TEMPLATE)["REVIEW"][keyof (typeof NOTIFICATION_TEMPLATE)["REVIEW"]];
