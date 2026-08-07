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
  const { hasChosenLocation, setLocation } = useServiceability();
  const { defaultAddress } = useAddresses();

  // If a default address is loaded, automatically set the location to it
  // on first load of the session or when the default address changes.
  useEffect(() => {
    if (defaultAddress) {
      const initializedId = sessionStorage.getItem(
        "mumzo_location_initialized_from_user",
      );
      if (initializedId !== defaultAddress.id) {
        sessionStorage.setItem(
          "mumzo_location_initialized_from_user",
          defaultAddress.id,
        );
        void setLocation(
          defaultAddress.pincode,
          defaultAddress.line2 || defaultAddress.city,
          {
            lat: defaultAddress.lat,
            lng: defaultAddress.lng,
          },
        );
      }
    } else {
      sessionStorage.removeItem("mumzo_location_initialized_from_user");
    }
  }, [defaultAddress, setLocation]);

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
