import type { Broadcaster, Connection, Room, WireEvent } from "./types";

/**
 * Single-process pub/sub — a `Map<Room, Set<Connection>>`. Correct as long
 * as the API runs as one instance (true today: the notification worker is
 * also in-process, same assumption). The moment the server scales to 2+
 * replicas, a publish from instance A never reaches a client connected to
 * instance B — that's the point at which this gets swapped for a Redis
 * pub/sub `Broadcaster` (SUBSCRIBE per room, PUBLISH fans out across
 * instances). Nothing outside this file needs to change to make that swap.
 */
export class InMemoryBroadcaster implements Broadcaster {
  private readonly rooms = new Map<Room, Set<Connection>>();

  join(room: Room, connection: Connection): void {
    let members = this.rooms.get(room);
    if (!members) {
      members = new Set();
      this.rooms.set(room, members);
    }
    members.add(connection);
    connection.rooms.add(room);
  }

  leave(room: Room, connection: Connection): void {
    this.rooms.get(room)?.delete(connection);
    connection.rooms.delete(room);
  }

  async publish(room: Room, event: WireEvent): Promise<void> {
    const members = this.rooms.get(room);
    if (!members || members.size === 0) return;

    const payload = JSON.stringify(event);
    for (const connection of members) {
      connection.send(payload);
    }
  }

  membersOf(room: Room): ReadonlySet<Connection> {
    return this.rooms.get(room) ?? new Set();
  }
}
