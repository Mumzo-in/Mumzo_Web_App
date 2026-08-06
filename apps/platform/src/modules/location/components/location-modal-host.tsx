import { lazy, Suspense, useEffect } from "react";

import { useModalStore } from "@/core/hooks/use-modal-store";
import { useAddresses } from "@/modules/account";
import { useServiceability } from "../store/serviceability-provider";

// Lazy-loaded for dynamic code splitting.
const LocationModal = lazy(() => import("./location-modal"));

/** Mounts the location modal when the modal store asks for it, and opens it
 * once automatically on a visitor's first session (before they've detected,
 * picked, or skipped a location). */
export default function LocationModalHost() {
  const { activeModal, openModal } = useModalStore();
  const { hasChosenLocation, setLocation, pincode, query } =
    useServiceability();
  const { defaultAddress } = useAddresses();

  // If a default address is loaded and the current location is the fallback default,
  // automatically set the location to the default address.
  useEffect(() => {
    if (defaultAddress) {
      const isFallback = pincode === "500034" && query === "Banjara Hills";
      if (isFallback) {
        void setLocation(defaultAddress.pincode, defaultAddress.city, {
          lat: defaultAddress.lat,
          lng: defaultAddress.lng,
        });
      }
    }
  }, [defaultAddress, pincode, query, setLocation]);

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
