import { create } from "zustand";

/**
 * Open/closed state for the secondary nav panel.
 *
 * Lifted out of `AdminSidebar` because the header's toggle needs it too, and
 * the two are siblings — a shared store beats threading props through the
 * layout. Persisted so the choice survives a reload.
 */

const STORAGE_KEY = "mumzo-admin-nav-panel";

function readInitial(): boolean {
  if (typeof window === "undefined") {
    return true;
  }
  return window.localStorage.getItem(STORAGE_KEY) !== "closed";
}

function persist(open: boolean) {
  window.localStorage.setItem(STORAGE_KEY, open ? "open" : "closed");
}

type NavPanelStore = {
  open: boolean;
  setOpen: (open: boolean) => void;
  toggle: () => void;
};

export const useNavPanel = create<NavPanelStore>((set, get) => ({
  open: readInitial(),
  setOpen: (open) => {
    persist(open);
    set({ open });
  },
  toggle: () => {
    const next = !get().open;
    persist(next);
    set({ open: next });
  },
}));
