import { create } from "zustand";

export type ModalType = "location" | "login" | "onboarding" | string;

interface ModalStore {
  activeModal: ModalType | null;
  modalData: unknown;
  openModal: (type: ModalType, data?: unknown) => void;
  closeModal: () => void;
}

export const useModalStore = create<ModalStore>((set) => ({
  activeModal: null,
  modalData: null,
  openModal: (type, data = null) => set({ activeModal: type, modalData: data }),
  closeModal: () => set({ activeModal: null, modalData: null }),
}));
