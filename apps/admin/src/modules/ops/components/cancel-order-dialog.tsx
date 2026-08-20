import { Button } from "@mumzo/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@mumzo/ui/components/dialog";
import { Label } from "@mumzo/ui/components/label";
import { RadioGroup, RadioGroupItem } from "@mumzo/ui/components/radio-group";
import { Textarea } from "@mumzo/ui/components/textarea";
import { useId, useState } from "react";
import type { AdminOrderSummary } from "@/modules/orders";

const CANCEL_REASONS = [
  "Customer requested cancellation",
  "Out of stock",
  "Duplicate order",
  "Delivery not possible",
  "Payment issue",
  "Other",
] as const;

type CancelOrderDialogProps = {
  order: AdminOrderSummary | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: (order: AdminOrderSummary, reason: string) => void;
};

export function CancelOrderDialog({
  order,
  onOpenChange,
  onConfirm,
}: CancelOrderDialogProps) {
  const [reason, setReason] = useState<string>(CANCEL_REASONS[0]);
  const [note, setNote] = useState("");
  const noteId = useId();
  const isOther = reason === "Other";
  const canConfirm = !isOther || note.trim().length > 0;

  function handleOpenChange(open: boolean) {
    if (!open) {
      setReason(CANCEL_REASONS[0]);
      setNote("");
    }
    onOpenChange(open);
  }

  function handleConfirm() {
    if (!order || !canConfirm) {
      return;
    }
    const finalReason = isOther ? note.trim() : reason;
    onConfirm(order, finalReason);
    handleOpenChange(false);
  }

  return (
    <Dialog open={order !== null} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Cancel order
            {order ? ` #${order.id.slice(0, 8).toUpperCase()}` : ""}?
          </DialogTitle>
          <DialogDescription>
            This can't be undone from here. Select a reason for the record.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <RadioGroup
            value={reason}
            onValueChange={(value) => setReason(value as string)}
            data-testid="cancel-order-reason"
          >
            {CANCEL_REASONS.map((option) => {
              const optionId = `cancel-reason-${option}`;
              return (
                <div key={option} className="flex items-center gap-2">
                  <RadioGroupItem value={option} id={optionId} />
                  <Label htmlFor={optionId} className="font-normal text-sm">
                    {option}
                  </Label>
                </div>
              );
            })}
          </RadioGroup>

          {isOther ? (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={noteId} className="text-xs">
                Reason
              </Label>
              <Textarea
                id={noteId}
                placeholder="Describe why this order is being cancelled…"
                value={note}
                onChange={(event) => setNote(event.target.value)}
                data-testid="cancel-order-note"
              />
            </div>
          ) : null}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Keep order
          </Button>
          <Button
            variant="destructive"
            disabled={!canConfirm}
            onClick={handleConfirm}
            data-testid="cancel-order-confirm"
          >
            Cancel order
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default CancelOrderDialog;
