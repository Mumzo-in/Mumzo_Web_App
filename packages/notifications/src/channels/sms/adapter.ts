import type { ChannelAdapter } from "../../core/types";

/** Scaffold only — no provider wired yet. The seam exists so a real
 * implementation is a new file, not a new interface. */
export const smsAdapter: ChannelAdapter = {
  channel: "sms",
  send() {
    throw new Error("SMS channel is not implemented yet.");
  },
};
