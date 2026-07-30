import type { ChannelAdapter } from "../../core/types";

/** Scaffold only — no provider (Resend/SES) wired yet. The seam exists so a
 * real implementation is a new file, not a new interface. */
export const emailAdapter: ChannelAdapter = {
  channel: "email",
  send() {
    throw new Error("Email channel is not implemented yet.");
  },
};
