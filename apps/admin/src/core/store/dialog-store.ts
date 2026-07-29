import { useSyncExternalStore } from "react";

/**
 * Global dialog registry. Lets any trigger (a toolbar button, a card's
 * context menu, a keyboard shortcut) open a dialog whose content is mounted
 * once — e.g. at the top of a page or in the root layout — instead of every
 * trigger owning its own `useState` + rendering its own dialog tree.
 *
 * Zero new dependencies: a module-level store read via `useSyncExternalStore`
 * is enough for "is dialog X open, with what payload" — no need for a full
 * state library for this.
 */

type DialogState = {
  openId: string | null;
  payload: unknown;
};

let state: DialogState = { openId: null, payload: undefined };
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) {
    listener();
  }
}

export function openDialog(id: string, payload?: unknown): void {
  state = { openId: id, payload };
  emit();
}

export function closeDialog(): void {
  state = { openId: null, payload: undefined };
  emit();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot(): DialogState {
  return state;
}

/** `true` when `id` is the currently open dialog. */
export function useDialogOpen(id: string): boolean {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot);
  return snapshot.openId === id;
}

/** The payload passed to `openDialog`, typed by the caller — `undefined` when closed or none was passed. */
export function useDialogPayload<T>(id: string): T | undefined {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot);
  return snapshot.openId === id ? (snapshot.payload as T) : undefined;
}
