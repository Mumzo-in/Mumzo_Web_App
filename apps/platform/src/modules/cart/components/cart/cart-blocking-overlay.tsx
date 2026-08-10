import { Spinner } from "@mumzo/ui/components/spinner";

/**
 * Blocks the cart page while a mutation (remove, qty change, select toggle,
 * clear, coupon apply/remove) is in flight — an indeterminate top bar plus a
 * dimmed, non-interactive overlay so a second click can't race the first
 * request. Mount once per page; visibility is the `active` prop, driven by
 * `useCart().isMutating`.
 */
export function CartBlockingOverlay({ active }: { active: boolean }) {
  if (!active) return null;

  return (
    <>
      <div
        aria-hidden="true"
        className="fixed inset-x-0 top-0 z-[60] h-0.5 overflow-hidden bg-primary/15"
      >
        <div className="top-loader-bar h-full w-1/3 rounded-full bg-primary" />
      </div>
      <div
        aria-live="polite"
        aria-busy="true"
        role="status"
        className="fixed inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur-[1px]"
      >
        <span className="sr-only">Updating cart…</span>
        <div className="flex items-center gap-2.5 rounded-full border border-border/60 bg-card px-4 py-2.5 shadow-warm">
          <Spinner className="size-4 text-primary" />
          <span className="font-semibold text-foreground/80 text-xs">
            Updating cart…
          </span>
        </div>
      </div>
    </>
  );
}

export default CartBlockingOverlay;
