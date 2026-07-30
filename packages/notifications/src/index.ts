import { send, sendToAllStaff } from "./core/notify";

export const notify = { send, sendToAllStaff };

export type {
  Channel,
  ChannelAdapter,
  DeviceTarget,
  NotificationJobInput,
  RenderedNotification,
  SendResult,
} from "./core/types";
export { startNotificationWorker } from "./core/worker";
export { defineTemplate, getTemplate } from "./templates";
