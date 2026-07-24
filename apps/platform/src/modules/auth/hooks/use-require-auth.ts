import { useModalStore } from "@/core/hooks/use-modal-store";
import { authClient } from "../api/auth-client";

/**
 * Gates an action behind sign-in without blocking the page it's called from.
 * Wrap any handler — a button's `onClick`, a form submit — with `run`: if
 * the visitor has a session, the action fires immediately; if not, the
 * "please sign in" modal opens instead and the action never runs. There is
 * no redirect and no page-level guard, so the surrounding page keeps
 * rendering normally either way.
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
      openModal("login", prompt);
      return;
    }
    action();
  }

  return { run, isAuthed: Boolean(session), isPending };
}
