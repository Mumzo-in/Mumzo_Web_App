/**
 * The closed set of sounds available to play, keyed by name — callers pass
 * `SOUNDS.newOrder`, never a raw path, so adding a sound later is one entry
 * here instead of a magic string at every call site.
 */
export const SOUNDS = {
  newOrder: "/sounds/happy_bells_sound.wav",
  /** Deliberately distinct from `newOrder` — a cancellation needs someone
   * to stop packing, and staff should be able to tell the two apart
   * without looking at the screen. */
  orderCancelled: "/sounds/cancelled.mp3",
  /** A delivery closed successfully — the only positive chime, so it is
   * played for the `delivered` outcome only, never for a failed attempt. */
  orderDelivered: "/sounds/delivered.mp3",
} as const;

export type SoundName = keyof typeof SOUNDS;
