/**
 * The closed set of rooms actually in use. A room string not listed here
 * still works at the type level (`Room` is just `string`) but should be
 * added here so it's discoverable — treat this as the room "registry".
 */
export const ROOMS = {
  /** Every connected staff member — new orders, status changes. Broad for
   * now; split into per-hub rooms (`admin:orders:<hubId>`) if/when hub-scoped
   * dashboards need it, without changing the publish call sites' shape. */
  adminOrders: "admin:orders",
} as const;

export type RoomName = (typeof ROOMS)[keyof typeof ROOMS];
