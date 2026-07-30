import { hub } from "./core/hub";

/** Public API — feature code (order placement, status updates, and future
 * features) only ever calls `realtime.publish`. Everything else in `core/`
 * is plumbing for the server's WS upgrade route. */
export const realtime = {
  publish: hub.publish.bind(hub),
};

export { hub } from "./core/hub";
export { ROOMS } from "./core/rooms";
export type {
  Broadcaster,
  Connection,
  ConnectionIdentity,
  Room,
  WireEvent,
} from "./core/types";
export { defineEvent, getEvent } from "./events";
