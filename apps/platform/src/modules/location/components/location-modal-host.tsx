import { lazy, Suspense } from "react";

import { useModalStore } from "@/core/hooks/use-modal-store";

// Lazy-loaded for dynamic code splitting.
const LocationModal = lazy(() => import("./location-modal"));

/** Mounts the location modal when the modal store asks for it. */
export default function LocationModalHost() {
  const { activeModal } = useModalStore();

  if (activeModal !== "location") return null;

  return (
    <Suspense fallback={null}>
      <LocationModal />
    </Suspense>
  );
}
