import { Button } from "@mumzo/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@mumzo/ui/components/dialog";
import { Field, FieldLabel } from "@mumzo/ui/components/field";
import { Switch } from "@mumzo/ui/components/switch";
import { useForm } from "@tanstack/react-form";
import { forwardRef, useImperativeHandle, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { NumberField, TextField } from "@/core/components/form-fields";
import type { ReferralTierInput } from "../api/referrals-api";
import type { ReferralTier } from "../data/referral-data";

const schema = z.object({
  name: z.string().min(1, "Name is required.").max(120),
  threshold: z.number().int().positive("Must be at least 1."),
  couponAmount: z.number().int().positive("Must be more than zero."),
  isActive: z.boolean(),
  sortOrder: z.number().int(),
});

type FormValues = z.infer<typeof schema>;

function emptyValues(nextSortOrder: number): FormValues {
  return {
    name: "",
    threshold: 1,
    couponAmount: 0,
    isActive: true,
    sortOrder: nextSortOrder,
  };
}

function valuesFrom(tier: ReferralTier): FormValues {
  return {
    name: tier.name,
    threshold: tier.threshold,
    couponAmount: tier.couponAmount,
    isActive: tier.isActive,
    sortOrder: 0,
  };
}

export type TierFormHandle = {
  open: (tier?: ReferralTier) => void;
};

/** Add/edit a reward tier — a Dialog, not a full page: five fields don't
 * warrant the coupon module's tabbed-sidebar page pattern. */
export const TierForm = forwardRef<
  TierFormHandle,
  {
    /** Sort order assigned to a brand-new tier — one past the current count. */
    nextSortOrder: number;
    onSubmit: (
      tier: ReferralTier | undefined,
      values: ReferralTierInput,
    ) => Promise<void>;
  }
>(function TierForm({ nextSortOrder, onSubmit }, ref) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ReferralTier | undefined>(undefined);
  const [pending, setPending] = useState(false);

  const form = useForm({
    defaultValues: editing ? valuesFrom(editing) : emptyValues(nextSortOrder),
    validators: { onSubmit: schema },
    onSubmit: async ({ value }) => {
      setPending(true);
      try {
        await onSubmit(editing, value);
        setOpen(false);
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Couldn't save the tier.",
        );
      } finally {
        setPending(false);
      }
    },
  });

  useImperativeHandle(ref, () => ({
    open: (tier) => {
      setEditing(tier);
      form.reset(tier ? valuesFrom(tier) : emptyValues(nextSortOrder));
      setOpen(true);
    },
  }));

  return (
    <Dialog
      onOpenChange={(next) => {
        if (!pending) setOpen(next);
      }}
      open={open}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {editing ? `Edit ${editing.name}` : "New tier"}
          </DialogTitle>
        </DialogHeader>

        <form
          className="flex flex-col gap-4"
          data-testid="admin-tier-form"
          onSubmit={(event) => {
            event.preventDefault();
            event.stopPropagation();
            form.handleSubmit();
          }}
        >
          <form.Field name="name">
            {(field) => (
              <TextField
                field={field}
                label="Tier name"
                placeholder="First invite"
                testId="admin-tier-name"
              />
            )}
          </form.Field>

          <form.Field name="threshold">
            {(field) => (
              <NumberField
                description="Successful referrals required to unlock this tier."
                field={field}
                label="Threshold"
                testId="admin-tier-threshold"
              />
            )}
          </form.Field>

          <form.Field name="couponAmount">
            {(field) => (
              <NumberField
                description="Coupon face value in whole rupees."
                field={field}
                label="Coupon amount (₹)"
                testId="admin-tier-amount"
              />
            )}
          </form.Field>

          <form.Field name="sortOrder">
            {(field) => (
              <NumberField
                description="Display order on the ladder — lower shows first."
                field={field}
                label="Sort order"
                testId="admin-tier-sort"
              />
            )}
          </form.Field>

          <form.Field name="isActive">
            {(field) => (
              <Field orientation="horizontal">
                <FieldLabel htmlFor={field.name}>Active</FieldLabel>
                <Switch
                  checked={field.state.value}
                  id={field.name}
                  onCheckedChange={(checked) => field.handleChange(checked)}
                />
              </Field>
            )}
          </form.Field>

          <DialogFooter>
            <Button
              disabled={pending}
              onClick={() => setOpen(false)}
              type="button"
              variant="outline"
            >
              Cancel
            </Button>
            <Button
              data-testid="admin-tier-submit"
              disabled={pending}
              type="submit"
            >
              {pending ? "Saving…" : editing ? "Save changes" : "Create tier"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
});

export default TierForm;
