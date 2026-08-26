import { Button } from "@mumzo/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@mumzo/ui/components/card";
import { Field, FieldGroup } from "@mumzo/ui/components/field";
import { Input } from "@mumzo/ui/components/input";
import { Label } from "@mumzo/ui/components/label";
import { useId, useState } from "react";

type DeliveryCodeGateProps = {
  onSubmit: (code: string) => void;
  pending: boolean;
  error: string | null;
};

/** The lock screen. Nothing about the customer renders until the rider's own
 * access code checks out, so a leaked URL on its own reveals nothing. */
export function DeliveryCodeGate({
  onSubmit,
  pending,
  error,
}: DeliveryCodeGateProps) {
  const [code, setCode] = useState("");
  const codeId = useId();

  return (
    <Card data-testid="delivery-code-gate">
      <CardHeader>
        <CardTitle>Enter your delivery code</CardTitle>
        <CardDescription>
          Use the personal code ops issued you. It identifies you as the rider
          for this delivery.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className="flex flex-col gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            if (code.trim()) {
              onSubmit(code.trim());
            }
          }}
        >
          <FieldGroup>
            <Field data-invalid={error ? true : undefined}>
              <Label htmlFor={codeId}>Delivery code</Label>
              <Input
                id={codeId}
                value={code}
                onChange={(event) => setCode(event.target.value)}
                placeholder="e.g. 4827"
                autoComplete="one-time-code"
                inputMode="numeric"
                aria-invalid={error ? true : undefined}
                data-testid="delivery-code-input"
              />
              {error ? (
                <p className="text-destructive text-sm">{error}</p>
              ) : null}
            </Field>
          </FieldGroup>

          <Button
            type="submit"
            size="lg"
            disabled={pending || code.trim().length === 0}
            data-testid="delivery-code-submit"
          >
            {pending ? "Checking…" : "Unlock delivery"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export default DeliveryCodeGate;
