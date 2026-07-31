/**
 * The closed set of sounds available to play, keyed by name — callers pass
 * `SOUNDS.newOrder`, never a raw path, so adding a sound later is one entry
 * here instead of a magic string at every call site.
 */
export const SOUNDS = {
  newOrder: "/sounds/happy_bells_sound.wav",
} as const;

export type SoundName = keyof typeof SOUNDS;
