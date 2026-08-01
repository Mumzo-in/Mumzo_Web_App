/**
 * `shared/` — domain logic used by both platform and admin. No routes.
 *
 * Anything with an invariant to protect lives here, so it exists in exactly
 * one place: the order state machine, inventory reservation, pricing and GST,
 * payment reconciliation.
 *
 * The reason is concrete. A customer cancelling an order and an operator
 * cancelling one must release inventory identically — implement that twice
 * and one of them will eventually forget.
 *
 * Rule of thumb: if getting it wrong costs money or corrupts data, it goes
 * here rather than in a surface module.
 */

export * from "./hub-resolution";
export * from "./inventory";
export * from "./pricing";
