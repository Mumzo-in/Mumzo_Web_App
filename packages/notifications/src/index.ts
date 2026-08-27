import { send, sendToAllStaff } from "./core/notify";

export const notify = { send, sendToAllStaff };

export {
  isWhatsAppConfigured,
  listTemplates as listWhatsAppTemplates,
  normalisePhone,
} from "./channels/whatsapp/client";
export { whatsappRender } from "./channels/whatsapp/render";
export {
  isSendable as isWhatsAppTemplateSendable,
  toPositionalParams,
  WHATSAPP_TEMPLATE,
  type WhatsAppTemplateKey,
} from "./channels/whatsapp/templates";
export {
  DEFAULT_NOTIFICATION_APP,
  isNotificationApp,
  NOTIFICATION_APPS,
  type NotificationApp,
  toNotificationApp,
} from "./core/apps";
export {
  completeJob,
  failJob,
  reclaimStalledJobs,
} from "./core/claim";
export {
  countDeadJobsByTemplate,
  type DeadJob,
  discardJob,
  getQueueStats,
  listDeadJobs,
  retryDeadJobs,
  retryJob,
  runRetentionSweep,
  startRetentionSweep,
} from "./core/dlq";
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
export {
  defineTemplate,
  getTemplate,
  listTemplates,
  renderTemplate,
} from "./templates";
export {
  NOTIFICATION_TEMPLATE,
  type NotificationTemplateId,
} from "./templates/ids";
