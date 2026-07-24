import { lazy, Suspense, useEffect, useRef } from "react";

import { useModalStore } from "@/core/hooks/use-modal-store";
import { authClient } from "../api/auth-client";

// Lazy-loaded for dynamic code splitting.
const OnboardingModal = lazy(() => import("./onboarding-modal"));

/**
 * Mounts the "complete your profile" modal when the modal store asks for it
 * — and asks for it itself. Watches the live session on every page (not
 * just right after a fresh sign-up): any visitor with an active session
 * whose `onboardedAt` is unset gets prompted once, whether that session was
 * just created or is a pre-existing one that predates this feature.
 */
export default function OnboardingModalHost() {
  const { activeModal, openModal } = useModalStore();
  const { data: session } = authClient.useSession();
  const prompted = useRef(false);

  useEffect(() => {
    if (prompted.current || !session?.user) {
      return;
    }
    const needsOnboarding = !(
      "onboardedAt" in session.user && session.user.onboardedAt
    );
    if (needsOnboarding) {
      prompted.current = true;
      openModal("onboarding");
    }
  }, [session, openModal]);

  if (activeModal !== "onboarding") return null;

  return (
    <Suspense fallback={null}>
      <OnboardingModal />
    </Suspense>
  );
}
