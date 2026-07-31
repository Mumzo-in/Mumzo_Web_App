import { SOUNDS, type SoundName } from "./sounds";

const cache = new Map<string, HTMLAudioElement>();

/**
 * Plays a sound by name (see `SOUNDS`), fire-and-forget. Swallows the
 * rejection browsers throw when autoplay is blocked (no prior user gesture
 * on the page yet) — that's an expected, common state, not a bug to surface.
 *
 * Cloning the cached element per play (`.cloneNode()`) lets two calls
 * overlap instead of the second cutting the first off mid-chime, which
 * matters if two orders land in quick succession.
 */
export function playSound(name: SoundName) {
  const src = SOUNDS[name];

  let base = cache.get(src);
  if (!base) {
    base = new Audio(src);
    cache.set(src, base);
  }

  const instance = base.cloneNode(true) as HTMLAudioElement;
  instance.play().catch(() => {
    // Autoplay policy or missing file — non-fatal, nothing to recover.
  });
}
