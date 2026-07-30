import type { WSContext } from "hono/ws";
import { createConnection } from "./connection";
import { InMemoryBroadcaster } from "./in-memory-broadcaster";
import { publish } from "./publish";
import type { Connection, ConnectionIdentity, Room } from "./types";

/**
 * The realtime hub — one instance per server process, holding the singleton
 * broadcaster and the connection lifecycle. The server's WS upgrade route is
 * the only thing that talks to `onOpen`/`onClose`; every feature (order
 * events today, chat/tracking later) only ever calls `hub.publish`.
 */
class RealtimeHub {
  private readonly broadcaster = new InMemoryBroadcaster();

  /** Call from the WS upgrade handler's `onOpen`. Joins the connection to
   * every room in `rooms` immediately — a connection with no rooms is inert
   * but harmless (e.g. a future "connected, hasn't subscribed yet" state). */
  onOpen(
    ws: WSContext,
    identity: ConnectionIdentity,
    rooms: Room[],
  ): Connection {
    const connection = createConnection(ws, identity);
    for (const room of rooms) {
      this.broadcaster.join(room, connection);
    }
    return connection;
  }

  /** Call from the WS upgrade handler's `onClose`. */
  onClose(connection: Connection): void {
    for (const room of [...connection.rooms]) {
      this.broadcaster.leave(room, connection);
    }
  }

  async publish(room: Room, type: string, data: unknown): Promise<void> {
    await publish(this.broadcaster, room, type, data);
  }

  membersOf(room: Room) {
    return this.broadcaster.membersOf(room);
  }
}

/** One hub per process — mirrors the notifications package's lazily-created
 * queue singleton. */
export const hub = new RealtimeHub();
