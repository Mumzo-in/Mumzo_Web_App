import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@mumzo/ui/components/alert-dialog";
import { Field, FieldLabel } from "@mumzo/ui/components/field";
import { Textarea } from "@mumzo/ui/components/textarea";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { OrderStatus } from "../api/orders-api";
import { cancelOrder } from "../api/orders-api";

/**
 * Statuses the server will actually accept a cancellation for — mirrors
 * `CANCELLABLE_STATUSES` in the platform orders service. Kept in sync by
 * hand: showing the button for a status the API rejects turns a clear
 * "you can't cancel this" into a failed request after the fact.
 */
const CANCELLABLE: ReadonlySet<string> = new Set([
  "pending_payment",
  "confirmed",
]);

export function canCancelOrder(status: OrderStatus | string): boolean {
  return CANCELLABLE.has(status);
}

/**
 * Cancel action plus its confirmation. Destructive and irreversible, so it
 * asks first and takes an optional reason — which reaches the packing team
 * as part of the cancellation alert, not just an audit log.
 */
export function CancelOrderDialog({
  orderId,
  onCancelled,
}: {
  orderId: string;
  onCancelled?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () => cancelOrder(orderId, reason.trim() || undefined),
    onSuccess: () => {
      // Both the detail view and the list show status, so both are stale.
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      toast.success("Order cancelled", {
        description: "You won't be charged for this order.",
      });
      setOpen(false);
      setReason("");
      onCancelled?.();
    },
    onError: (error: Error) => {
      toast.error("Could not cancel", { description: error.message });
    },
  });

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        data-testid="order-cancel"
        className="inline-flex items-center justify-center gap-2 rounded-full border border-destructive/30 py-3 font-semibold text-destructive text-sm transition-colors hover:bg-destructive/10"
      >
        <X size={15} />
        Cancel order
      </button>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel this order?</AlertDialogTitle>
            <AlertDialogDescription>
              This can't be undone. You won't be charged, and anything already
              being packed will be put back.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <Field>
            <FieldLabel htmlFor="cancel-reason">
              Reason <span className="text-foreground/50">(optional)</span>
            </FieldLabel>
            <Textarea
              id="cancel-reason"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Ordered by mistake, changed my mind…"
              rows={3}
              data-testid="order-cancel-reason"
            />
          </Field>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={mutation.isPending}>
              Keep order
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                // The dialog closes on its own action click; keep it open
                // until the request resolves so a failure is visible here
                // rather than on a screen the user has already left.
                event.preventDefault();
                mutation.mutate();
              }}
              disabled={mutation.isPending}
              data-testid="order-cancel-confirm"
            >
              {mutation.isPending ? "Cancelling…" : "Yes, cancel it"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
