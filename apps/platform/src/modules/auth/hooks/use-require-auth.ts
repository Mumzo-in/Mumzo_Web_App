import { useModalStore } from "@/core/hooks/use-modal-store";
import { authClient } from "../api/auth-client";

/** Payload the `"login"` modal type carries — `RequireAuthModal` reads this
 * to show a contextual prompt and to resume the gated action once sign-in
 * succeeds, instead of silently dropping whatever the visitor was doing. */
export interface RequireAuthModalData {
  prompt?: string;
  onSuccess?: () => void;
}

/**
 * Gates an action behind sign-in without blocking the page it's called from.
 * Wrap any handler — a button's `onClick`, a form submit — with `run`: if
 * the visitor has a session, the action fires immediately; if not, the
 * "please sign in" modal opens instead, and the same action fires
 * automatically once sign-in succeeds (see `RequireAuthModal`). There is no
 * redirect and no page-level guard, so the surrounding page keeps rendering
 * normally either way.
 *
 * ```tsx
 * const { run, isAuthed } = useRequireAuth();
 * <Button onClick={() => run(() => addToCart(product))}>Add to cart</Button>
 * ```
 */
export function useRequireAuth() {
  const { data: session, isPending } = authClient.useSession();
  const { openModal } = useModalStore();

  function run(action: () => void, prompt?: string) {
    if (!session) {
      const data: RequireAuthModalData = { prompt, onSuccess: action };
      openModal("login", data);
      return;
    }
    action();
  }

  return { run, isAuthed: Boolean(session), isPending };
}
