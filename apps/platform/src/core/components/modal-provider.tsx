import { lazy, Suspense } from "react";
import { useModalStore } from "@/core/hooks/use-modal-store";

// Lazy-load modal components for dynamic code splitting
const LocationModal = lazy(() => import("./modals/location-modal"));

export default function ModalProvider() {
  const { activeModal } = useModalStore();

  if (!activeModal) return null;

  return (
    <Suspense fallback={null}>
      {activeModal === "location" && <LocationModal />}
    </Suspense>
  );
}
