import { Button } from "@mumzo/ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@mumzo/ui/components/card";
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
import { CheckCircle2, RotateCcw, XCircle } from "lucide-react";
import { useId, useState } from "react";
import {
  DELIVERY_OUTCOME_META,
  DELIVERY_REASONS,
  type DeliveryOutcome,
} from "../data/delivery-data";

type DeliveryActionPanelProps = {
  onSubmit: (outcome: DeliveryOutcome, reason?: string) => void;
  pending: boolean;
};

const OUTCOME_ICONS = {
  delivered: CheckCircle2,
  cancelled: XCircle,
  returned: RotateCcw,
} as const;

/** The rider's three exits. Delivered confirms in one step; cancelled and
 * returned open a reason picker first, because those two are the ones ops has
 * to explain later. */
export function DeliveryActionPanel({
  onSubmit,
  pending,
}: DeliveryActionPanelProps) {
  const [outcome, setOutcome] = useState<DeliveryOutcome | null>(null);
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");
  const noteId = useId();

  const reasons = outcome ? DELIVERY_REASONS[outcome] : [];
  const isOther = reason === "Other";
  const canConfirm =
    outcome === "delivered" ||
    (reason.length > 0 && (!isOther || note.trim().length > 0));

  function open(next: DeliveryOutcome) {
    setOutcome(next);
    setReason(next === "delivered" ? "" : (DELIVERY_REASONS[next][0] ?? ""));
    setNote("");
  }

  function handleOpenChange(next: boolean) {
    if (!next) {
      setOutcome(null);
      setReason("");
      setNote("");
    }
  }

  function handleConfirm() {
    if (!outcome || !canConfirm) {
      return;
    }
    const finalReason =
      outcome === "delivered" ? undefined : isOther ? note.trim() : reason;
    onSubmit(outcome, finalReason);
    handleOpenChange(false);
  }

  return (
    <>
      <Card data-testid="delivery-action-panel">
        <CardHeader>
          <CardTitle className="text-base">Update this delivery</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {(["delivered", "cancelled", "returned"] as const).map((option) => {
            const Icon = OUTCOME_ICONS[option];
            return (
              <Button
                key={option}
                variant={option === "delivered" ? "default" : "outline"}
                size="lg"
                disabled={pending}
                onClick={() => open(option)}
                data-testid={`delivery-action-${option}`}
                className="w-full justify-center"
              >
                <Icon data-icon />
                {DELIVERY_OUTCOME_META[option].verb}
              </Button>
            );
          })}
        </CardContent>
      </Card>

      <Dialog open={outcome !== null} onOpenChange={handleOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {outcome ? DELIVERY_OUTCOME_META[outcome].verb : "Confirm"}?
            </DialogTitle>
            <DialogDescription>
              {outcome === "delivered"
                ? "Confirm the order was handed over to the customer."
                : "Pick a reason — ops sees this against the order."}
            </DialogDescription>
          </DialogHeader>

          {reasons.length > 0 ? (
            <div className="flex flex-col gap-4">
              <RadioGroup
                value={reason}
                onValueChange={(value) => setReason(value as string)}
                data-testid="delivery-reason"
              >
                {reasons.map((option) => {
                  const optionId = `delivery-reason-${option}`;
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
                    placeholder="What happened?"
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                    data-testid="delivery-reason-note"
                  />
                </div>
              ) : null}
            </div>
          ) : null}

          <DialogFooter>
            <Button variant="outline" onClick={() => handleOpenChange(false)}>
              Back
            </Button>
            <Button
              variant={outcome === "delivered" ? "default" : "destructive"}
              disabled={!canConfirm || pending}
              onClick={handleConfirm}
              data-testid="delivery-confirm"
            >
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default DeliveryActionPanel;
