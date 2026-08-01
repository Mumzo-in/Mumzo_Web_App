import { useEffect, useState } from "react";
import { useGeolocation } from "@/core/hooks/use-geolocation";
import { useModalStore } from "@/core/hooks/use-modal-store";
import { type Address, useAddresses } from "@/modules/account";
import { useRequireAuth } from "@/modules/auth";
import { reverseGeocode } from "../api/places";
import { findNearestServiceArea } from "../data/serviceability-data";
import { useServiceability } from "../store/serviceability-provider";

export type LocationStep = "list" | "ask" | "manual" | "save";

export interface ResolvedLocation {
  area: string;
  pincode: string;
  city: string;
  line2: string;
  lat?: number | null;
  lng?: number | null;
}

/**
 * Owns every piece of state/orchestration behind the location picker's
 * step flow (list → ask → manual → save), so `LocationModal` only has to
 * render whichever step this reports plus the Dialog/Drawer shell.
 */
export function useLocationFlow() {
  const { activeModal, closeModal } = useModalStore();
  const { setLocation, markChosen } = useServiceability();
  const { addAddress, addresses } = useAddresses();
  const { run: runIfAuthed } = useRequireAuth();
  const geolocation = useGeolocation();

  const isOpen = activeModal === "location";
  const [step, setStep] = useState<LocationStep>("ask");
  const [resolved, setResolved] = useState<ResolvedLocation | null>(null);
  // Spans the whole "use current location" flow — the browser's own
  // permission prompt (`geolocation.status === "locating"`) plus the
  // follow-up reverse-geocode API call, which the geolocation hook alone
  // doesn't know about.
  const [resolvingLocation, setResolvingLocation] = useState(false);

  // Open on the saved-addresses list when the visitor already has any —
  // "use current location" / "enter manually" become secondary options from
  // there instead of always being the first thing shown.
  // biome-ignore lint/correctness/useExhaustiveDependencies: only re-derive on open, not on every addresses.length change mid-flow
  useEffect(() => {
    if (isOpen) {
      setStep(addresses.length > 0 ? "list" : "ask");
      setResolved(null);
    }
  }, [isOpen]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: only react to the geolocation result itself, not to the callback identities
  useEffect(() => {
    if (geolocation.status === "granted" && geolocation.coords) {
      resolveFromCoords(geolocation.coords);
    }
  }, [geolocation.status, geolocation.coords]);

  const handleLocationResolved = (next: ResolvedLocation) => {
    void setLocation(next.pincode, next.area, {
      lat: next.lat,
      lng: next.lng,
    });
    setResolved(next);
    setStep("save");
  };

  const resolveFromCoords = async (coords: { lat: number; lng: number }) => {
    setResolvingLocation(true);
    const nearest = findNearestServiceArea(coords);
    if (!nearest) {
      setResolvingLocation(false);
      markChosen();
      closeModal();
      return;
    }
    const details = await reverseGeocode(coords.lat, coords.lng).catch(
      () => null,
    );
    setResolvingLocation(false);
    handleLocationResolved({
      area: nearest.area,
      pincode: details?.pincode || nearest.pincode,
      city: details?.city || "Hyderabad",
      line2: details?.formattedAddress || nearest.area,
      lat: coords.lat,
      lng: coords.lng,
    });
  };

  const handleSkip = () => {
    markChosen();
    closeModal();
  };

  const handleSelectAddress = (address: Address) => {
    void setLocation(address.pincode, address.city, {
      lat: address.lat,
      lng: address.lng,
    });
    closeModal();
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      // Skipping is implicit if they dismiss without picking anything —
      // "list" doesn't need this since having saved addresses at all already
      // implies a location was chosen previously.
      if (step === "ask") markChosen();
      closeModal();
    }
  };

  const handleSaveAddress = (draft: Omit<Address, "id">) => {
    // Signed-out visitors get the login modal instead of a failing request;
    // `useRequireAuth` resumes this exact save once sign-in succeeds, so the
    // filled-in draft isn't lost. The location itself is already applied via
    // handleLocationResolved regardless of auth state.
    runIfAuthed(() => {
      void addAddress(draft).then(() => closeModal());
    }, "Sign in to save this address.");
  };

  return {
    isOpen,
    step,
    setStep,
    resolved,
    resolvingLocation,
    addresses,
    geolocation,
    closeModal,
    handleSkip,
    handleSelectAddress,
    handleLocationResolved,
    handleOpenChange,
    handleSaveAddress,
  };
}
