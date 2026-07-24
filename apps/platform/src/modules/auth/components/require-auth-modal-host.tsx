import { lazy, Suspense } from "react";

import { useModalStore } from "@/core/hooks/use-modal-store";

// Lazy-loaded for dynamic code splitting.
const RequireAuthModal = lazy(() => import("./require-auth-modal"));

/** Mounts the "please sign in" modal when the modal store asks for it. */
export default function RequireAuthModalHost() {
  const { activeModal } = useModalStore();

  if (activeModal !== "login") return null;

  return (
    <Suspense fallback={null}>
      <RequireAuthModal />
    </Suspense>
  );
}
