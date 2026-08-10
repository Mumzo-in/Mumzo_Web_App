import type { ReactNode } from "react";
import { create } from "zustand";

export type PopupVariant = "success" | "error" | "info" | "cart";

export interface PopupPayload {
  variant: PopupVariant;
  title: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  /** Auto-dismiss after this many ms. Omit for manual close only. */
  duration?: number;
  actionLabel?: string;
  onAction?: () => void;
}

interface PopupStore {
  popup: PopupPayload | null;
  showPopup: (payload: PopupPayload) => void;
  hidePopup: () => void;
}

export const usePopupStore = create<PopupStore>((set) => ({
  popup: null,
  showPopup: (payload) => set({ popup: payload }),
  hidePopup: () => set({ popup: null }),
}));
