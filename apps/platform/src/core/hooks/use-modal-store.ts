import { create } from "zustand";

export type ModalType = "location" | "login" | string;

interface ModalStore {
  activeModal: ModalType | null;
  modalData: unknown;
  location: string;
  openModal: (type: ModalType, data?: unknown) => void;
  closeModal: () => void;
  setLocation: (loc: string) => void;
}

export const useModalStore = create<ModalStore>((set) => ({
  activeModal: null,
  modalData: null,
  location: "Banjara Hills",
  openModal: (type, data = null) => set({ activeModal: type, modalData: data }),
  closeModal: () => set({ activeModal: null, modalData: null }),
  setLocation: (loc) => set({ location: loc }),
}));
