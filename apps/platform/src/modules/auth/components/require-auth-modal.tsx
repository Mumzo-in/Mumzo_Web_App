import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@mumzo/ui/components/dialog";
import { useQueryClient } from "@tanstack/react-query";
import { LogIn } from "lucide-react";
import { useModalStore } from "@/core/hooks/use-modal-store";
import type { RequireAuthModalData } from "../hooks/use-require-auth";
import SignInForm from "./forms/sign-in-form";

/**
 * The modal `useRequireAuth` opens when a signed-out visitor triggers a
 * gated action (e.g. "Add to cart"). Renders the same `SignInForm` used on
 * the standalone `/auth/login` page, but closes itself on success instead of
 * navigating — the visitor stays on whatever page they were already on.
 *
 * `modalData` is either a plain string prompt (older/simpler call sites like
 * `openModal("login")` with no payload) or a `RequireAuthModalData` object
 * carrying the prompt plus the gated action to resume once sign-in
 * succeeds — without that, whatever the visitor was doing (e.g. saving an
 * address) would silently vanish the moment the modal took over.
 */
export default function RequireAuthModal() {
  const { activeModal, modalData, closeModal } = useModalStore();
  const queryClient = useQueryClient();

  const isOpen = activeModal === "login";
  const data: RequireAuthModalData =
    typeof modalData === "string"
      ? { prompt: modalData }
      : ((modalData as RequireAuthModalData | null) ?? {});
  const prompt = data.prompt ?? "Sign in to continue.";

  return (
    <Dialog onOpenChange={(open) => !open && closeModal()} open={isOpen}>
      <DialogContent
        className="rounded-3xl border border-border/60 bg-background p-0 shadow-warm sm:max-w-md"
        data-testid="web-require-auth-modal"
      >
        <DialogHeader className="px-6 pt-6">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-peach">
            <LogIn className="text-ink" size={20} />
          </div>
          <DialogTitle className="text-center font-editorial text-2xl text-ink leading-tight">
            Please sign in
          </DialogTitle>
          <DialogDescription className="mt-1 text-center text-foreground/60">
            {prompt}
          </DialogDescription>
        </DialogHeader>

        <SignInForm
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ["auth-session"] });
            closeModal();
            data.onSuccess?.();
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
