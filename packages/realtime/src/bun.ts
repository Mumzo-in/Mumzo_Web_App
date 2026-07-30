import { createBunWebSocket } from "hono/bun";
import type { WSContext } from "hono/ws";

/**
 * One `{ upgradeWebSocket, websocket }` pair for the whole process — Bun
 * requires the `websocket` handler object to be passed once to `Bun.serve`
 * (or, with the implicit `export default { fetch, websocket }` form, added
 * to that object). `upgradeWebSocket` is what the WS route in
 * `apps/server/.../ws` module uses; `websocket` is re-exported from
 * `apps/server/src/index.ts` so Bun's runtime picks it up.
 */
export const { upgradeWebSocket, websocket } = createBunWebSocket<WSContext>();
