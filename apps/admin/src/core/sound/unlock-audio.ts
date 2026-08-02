let unlocked = false;

/**
 * Browsers block audio playback until a real user gesture (click/tap) has
 * happened on the page — `playSound` swallows that rejection silently, so a
 * new-order chime can go unheard for an entire shift with no visible error.
 * Call this from a click handler once (the permission card's button) to
 * "warm up" playback for every `playSound` call afterward in the session.
 */
export function unlockAudio(): boolean {
  if (unlocked) return true;

  try {
    const audio = new Audio();
    audio.muted = true;
    void audio.play();
    unlocked = true;
  } catch {
    unlocked = false;
  }

  return unlocked;
}

export function isAudioUnlocked(): boolean {
  return unlocked;
}
