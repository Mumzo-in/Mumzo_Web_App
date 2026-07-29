import { lazy, Suspense, useEffect } from "react";

import { useModalStore } from "@/core/hooks/use-modal-store";
import { useServiceability } from "../store/serviceability-provider";

// Lazy-loaded for dynamic code splitting.
const LocationModal = lazy(() => import("./location-modal"));

/** Mounts the location modal when the modal store asks for it, and opens it
 * once automatically on a visitor's first session (before they've detected,
 * picked, or skipped a location). */
export default function LocationModalHost() {
  const { activeModal, openModal } = useModalStore();
  const { hasChosenLocation } = useServiceability();

  // biome-ignore lint/correctness/useExhaustiveDependencies: run once on mount only, not on every hasChosenLocation/openModal change
  useEffect(() => {
    if (!hasChosenLocation) {
      openModal("location");
    }
  }, []);

  if (activeModal !== "location") return null;

  return (
    <Suspense fallback={null}>
      <LocationModal />
    </Suspense>
  );
}
