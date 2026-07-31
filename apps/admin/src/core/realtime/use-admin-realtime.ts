import { env } from "@mumzo/env/web";
import { useEffect, useRef } from "react";

import { type AdminRealtimeEvent, isAdminRealtimeEvent } from "./events";

const LOG_PREFIX = "[admin-ws]";

/** ws(s)://<host>/api/v1/admin/ws — same host resolution as the REST client
 * (`core/api/client.ts`), swapped to the ws(s) scheme. */
function getWsUrl(): string {
  const serverUrl = env.VITE_SERVER_URL || "http://localhost:3000";
  const url = new URL(`${serverUrl}/api/v1/admin/ws`);
  url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
  return url.toString();
}

const RECONNECT_BASE_DELAY_MS = 1000;
const RECONNECT_MAX_DELAY_MS = 30_000;

/**
 * Opens the admin WS connection and dispatches every incoming event to
 * `onEvent`. Mount once (in `(admin)/_layout.tsx`, per
 * docs/infra/realtime-architecture.md) — a fresh connection per page would
 * mean re-authenticating and re-joining rooms on every navigation.
 *
 * Reconnects with exponential backoff on drop; gives up trying to be clever
 * about *why* it dropped (auth expiry, network blip, server restart) and
 * just retries — the next successful connection re-authenticates via the
 * session cookie regardless.
 */
export function useAdminRealtime(onEvent: (event: AdminRealtimeEvent) => void) {
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  useEffect(() => {
    let socket: WebSocket | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | undefined;
    let reconnectDelay = RECONNECT_BASE_DELAY_MS;
    let stopped = false;

    function connect() {
      if (stopped) return;

      const url = getWsUrl();
      console.info(`${LOG_PREFIX} connecting…`, url);
      socket = new WebSocket(url);

      socket.onopen = () => {
        console.info(`${LOG_PREFIX} connected`, url);
        reconnectDelay = RECONNECT_BASE_DELAY_MS;
      };

      socket.onmessage = (event) => {
        console.debug(`${LOG_PREFIX} message`, event.data);
        try {
          const parsed = JSON.parse(event.data);
          if (isAdminRealtimeEvent(parsed)) {
            onEventRef.current(parsed);
          } else {
            console.warn(`${LOG_PREFIX} unrecognized event shape`, parsed);
          }
        } catch (error) {
          console.warn(`${LOG_PREFIX} failed to parse message`, error);
        }
      };

      socket.onclose = (event) => {
        console.warn(
          `${LOG_PREFIX} closed`,
          { code: event.code, reason: event.reason, wasClean: event.wasClean },
          stopped
            ? "(unmount, not reconnecting)"
            : `reconnecting in ${reconnectDelay}ms`,
        );
        if (stopped) return;
        reconnectTimer = setTimeout(connect, reconnectDelay);
        reconnectDelay = Math.min(reconnectDelay * 2, RECONNECT_MAX_DELAY_MS);
      };

      socket.onerror = (event) => {
        console.error(`${LOG_PREFIX} error`, event);
        socket?.close();
      };
    }

    connect();

    return () => {
      stopped = true;
      clearTimeout(reconnectTimer);
      socket?.close();
    };
  }, []);
}
