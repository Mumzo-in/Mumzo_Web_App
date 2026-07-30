import type { WSContext } from "hono/ws";

import type { Connection, ConnectionIdentity } from "./types";

let nextId = 0;

/** Wraps a Hono `WSContext` so feature code (event publishers, the upgrade
 * handler) never imports `hono/ws` directly — only this file does. */
export function createConnection(
  ws: WSContext,
  identity: ConnectionIdentity,
): Connection {
  nextId += 1;
  const id = `conn_${nextId}`;

  return {
    id,
    identity,
    rooms: new Set(),
    send(data: string) {
      ws.send(data);
    },
    close() {
      ws.close();
    },
  };
}
