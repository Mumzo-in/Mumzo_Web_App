import { getEvent } from "../events";
import type { Broadcaster, Room } from "./types";

/** Validates `data` against the event's schema before it ever reaches
 * `Broadcaster.publish` — a malformed payload fails at the call site, not
 * silently over the wire to every connected client. */
export async function publish(
  broadcaster: Broadcaster,
  room: Room,
  type: string,
  data: unknown,
): Promise<void> {
  const event = getEvent(type);
  const validated = event.dataSchema.parse(data);

  await broadcaster.publish(room, {
    type,
    data: validated,
    emittedAt: new Date().toISOString(),
  });
}
