import { send, sendToAllStaff } from "./core/notify";

export const notify = { send, sendToAllStaff };

export {
  completeJob,
  failJob,
  reclaimStalledJobs,
} from "./core/claim";
export {
  enqueue,
  enqueueMany,
  PRIORITY_BULK,
  PRIORITY_TRANSACTIONAL,
} from "./core/queue";
export type {
  Channel,
  ChannelAdapter,
  DeviceTarget,
  NotificationJobInput,
  RenderedNotification,
  SendResult,
} from "./core/types";
export {
  type NotificationWorker,
  startNotificationWorker,
} from "./core/worker";
export { defineTemplate, getTemplate, renderTemplate } from "./templates";
