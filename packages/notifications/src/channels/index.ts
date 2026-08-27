import type { Channel, ChannelAdapter } from "../core/types";
import { emailAdapter } from "./email/adapter";
import { fcmAdapter } from "./fcm/adapter";
import { smsAdapter } from "./sms/adapter";
import { webPushAdapter } from "./web-push/adapter";
import { whatsappAdapter } from "./whatsapp/adapter";

/** Adding a channel: implement `ChannelAdapter` in a new folder, add it
 * here. Nothing else in the dispatcher changes. */
const adapters: Record<Channel, ChannelAdapter> = {
  fcm: fcmAdapter,
  "web-push": webPushAdapter,
  email: emailAdapter,
  sms: smsAdapter,
  whatsapp: whatsappAdapter,
};

export function getAdapter(channel: Channel): ChannelAdapter {
  return adapters[channel];
}
