export const CHANNELS = ["fcm", "web-push", "email", "sms"] as const;
export type Channel = (typeof CHANNELS)[number];

/** What a template's `render` function produces for a given channel. */
export type RenderedNotification = {
  title: string;
  body: string;
  /** In-app route the client should open when the notification is tapped. */
  deeplink?: string;
  /** Arbitrary channel-specific extras (e.g. an image URL for FCM). */
  data?: Record<string, string>;
};

/** A device row narrowed to what an adapter needs to actually send. */
export type DeviceTarget = {
  id: string;
  userId: string;
  channel: Channel;
  token: string;
};

export type SendResult =
  | { ok: true; providerMessageId: string }
  | {
      ok: false;
      error: string;
      /** Token is dead — caller should deactivate the device. */
      permanent: boolean;
    };

/** Every channel implements this — adding a channel is a new folder + a
 * registration line in `channels/index.ts`, nothing else changes. */
export interface ChannelAdapter {
  channel: Channel;
  send(
    payload: RenderedNotification,
    target: DeviceTarget,
  ): Promise<SendResult>;
  /**
   * Optional batched send. Returns one result per target, in input order,
   * so the caller can map each outcome back to the device row it came
   * from. Adapters without a batch API simply omit this and the dispatcher
   * falls back to concurrent `send()` calls.
   */
  sendMany?(
    payload: RenderedNotification,
    targets: DeviceTarget[],
  ): Promise<SendResult[]>;
}

/** Which device table the dispatcher queries — customer sends read
 * `user_device` (keyed to `user.id`), staff sends read `staff_device`
 * (keyed to the separate `staff_user.id` space). Defaults to "customer" so
 * every existing call site stays unchanged. */
export type Audience = "customer" | "staff";

/** What callers pass to `notify.send()`. `userId` is whichever id space
 * `audience` implies — a customer `user.id` or a `staff_user.id`. */
export type NotificationJobInput = {
  userId: string;
  templateId: string;
  data: unknown;
  audience?: Audience;
};

/** What actually goes on the BullMQ queue. */
export type NotificationJobPayload = NotificationJobInput;
