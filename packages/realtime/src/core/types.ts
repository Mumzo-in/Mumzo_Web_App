import type { WSContext } from "hono/ws";

/**
 * A room is just a string channel name — connections join one or more rooms,
 * `publish(room, ...)` fans out to everyone in it. `ROOMS` in `./rooms.ts` is
 * the closed set actually in use; this stays a plain string so a new feature
 * can add a room constant without touching this type.
 */
export type Room = string;

/** One live connection, wrapped so the transport (Bun WS today) is not
 * exposed to feature code — only `send`/`close`/`rooms` are. */
export type Connection = {
  id: string;
  /** Opaque identity set at upgrade time — e.g. `{ kind: "staff", staffUserId }`.
   * Feature code narrows on `kind` rather than trusting client-sent identity. */
  identity: ConnectionIdentity;
  rooms: Set<Room>;
  send(data: string): void;
  close(): void;
};

export type ConnectionIdentity =
  | { kind: "staff"; staffUserId: string }
  | { kind: "customer"; userId: string };

/** What actually goes out over the wire — every event is `{ type, data }`,
 * discriminated by `type` so the client can narrow without a schema import. */
export type WireEvent<TType extends string = string, TData = unknown> = {
  type: TType;
  data: TData;
  /** Server-side emit time — lets a client detect and discard stale events
   * after a reconnect gap, without the server tracking per-client cursors. */
  emittedAt: string;
};

/**
 * The seam a future multi-instance deploy swaps out: today `publish` and
 * `subscribe` operate on an in-process `Map<Room, Set<Connection>>`
 * (`./in-memory-broadcaster.ts`). A Redis pub/sub adapter implementing the
 * same interface is a drop-in replacement — nothing in `events/*` or the
 * server's upgrade handler needs to change.
 */
export interface Broadcaster {
  publish(room: Room, event: WireEvent): Promise<void>;
  /** Registers a connection's raw `WSContext` so `publish` can reach it —
   * called once per room the connection joins. */
  join(room: Room, connection: Connection): void;
  leave(room: Room, connection: Connection): void;
  /** All connections currently in a room — used for connection-count metrics,
   * not for iterating to send (that's what `publish` is for). */
  membersOf(room: Room): ReadonlySet<Connection>;
}

export type { WSContext };
