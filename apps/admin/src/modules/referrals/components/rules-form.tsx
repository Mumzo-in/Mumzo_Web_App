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
import type { ReferralRulesInput } from "../api/referrals-api";
import type { ReferralRules } from "../data/referral-data";

const schema = z.object({
  returnWindowHours: z.number().int().min(0),
  couponValidityDays: z.number().int().min(1),
  monthlyCapPerUser: z.number().int().min(0),
  refereeReward: z.number().int().min(0),
  refereeMinOrder: z.number().int().min(0),
  codePattern: z.string().trim().min(1).max(60),
  selfReferralBlock: z.boolean(),
  settleOnDelivery: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

export type RulesFormHandle = {
  open: () => void;
};

/** Edit the programme rules — a Dialog, matching `TierForm`'s pattern, so
 * the rules card can stay a compact read-only summary instead of an
 * always-open six-field grid. */
export const RulesForm = forwardRef<
  RulesFormHandle,
  {
    rules: ReferralRules;
    codePattern: string;
    onSubmit: (values: ReferralRulesInput) => Promise<void>;
  }
>(function RulesForm({ rules, codePattern, onSubmit }, ref) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);

  const form = useForm({
    defaultValues: { ...rules, codePattern } as FormValues,
    validators: { onSubmit: schema },
    onSubmit: async ({ value, formApi }) => {
      setPending(true);
      try {
        await onSubmit(value);
        formApi.reset(value);
        setOpen(false);
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Couldn't save the rules.",
        );
      } finally {
        setPending(false);
      }
    },
  });

  useImperativeHandle(ref, () => ({
    open: () => {
      form.reset({ ...rules, codePattern });
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
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit programme rules</DialogTitle>
        </DialogHeader>

        <form
          className="flex flex-col gap-4"
          data-testid="admin-rules-form"
          onSubmit={(event) => {
            event.preventDefault();
            event.stopPropagation();
            form.handleSubmit();
          }}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <form.Field name="returnWindowHours">
              {(field) => (
                <NumberField
                  description="Hours after delivery before a completed order can no longer be returned."
                  field={field}
                  label="Return window (hours)"
                  testId="referral-return-window"
                />
              )}
            </form.Field>
            <form.Field name="couponValidityDays">
              {(field) => (
                <NumberField
                  description="Days an issued coupon stays redeemable."
                  field={field}
                  label="Coupon validity (days)"
                  testId="referral-coupon-validity"
                />
              )}
            </form.Field>
            <form.Field name="monthlyCapPerUser">
              {(field) => (
                <NumberField
                  description="Max tier coupons a referrer can earn per month. 0 = no cap."
                  field={field}
                  label="Monthly cap / user"
                  testId="referral-monthly-cap"
                />
              )}
            </form.Field>
            <form.Field name="refereeReward">
              {(field) => (
                <NumberField
                  description="Reward the referred friend gets on their first order."
                  field={field}
                  label="Friend's first-order reward (₹)"
                  testId="referral-referee-reward"
                />
              )}
            </form.Field>
            <form.Field name="refereeMinOrder">
              {(field) => (
                <NumberField
                  description="Minimum order value required to redeem the friend's welcome coupon."
                  field={field}
                  label="Friend's min. order value (₹)"
                  testId="referral-referee-min-order"
                />
              )}
            </form.Field>
            <form.Field name="codePattern">
              {(field) => (
                <TextField
                  description="Documents how a referrer's code is generated, e.g. {NAME}{RANDOM3}."
                  field={field}
                  label="Code pattern"
                  testId="referral-code-pattern"
                />
              )}
            </form.Field>
            <form.Field name="selfReferralBlock">
              {(field) => (
                <Field orientation="horizontal" className="pt-2">
                  <FieldLabel htmlFor={field.name}>
                    Block self-referral
                  </FieldLabel>
                  <Switch
                    checked={field.state.value}
                    data-testid="referral-self-block"
                    id={field.name}
                    onCheckedChange={(checked) => field.handleChange(checked)}
                  />
                </Field>
              )}
            </form.Field>
            <form.Field name="settleOnDelivery">
              {(field) => (
                <Field className="pt-2 sm:col-span-2" orientation="horizontal">
                  <FieldLabel htmlFor={field.name}>
                    Claim on delivery
                  </FieldLabel>
                  <Switch
                    checked={field.state.value}
                    data-testid="referral-settle-on-delivery"
                    id={field.name}
                    onCheckedChange={(checked) => field.handleChange(checked)}
                  />
                </Field>
              )}
            </form.Field>
          </div>
          <p className="-mt-2 text-muted-foreground text-xs">
            When on, a referrer's coupon is issued — and immediately usable — as
            soon as the friend's order is delivered, instead of waiting for the
            return window to pass.
          </p>

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
              data-testid="referral-rules-save"
              disabled={pending}
              type="submit"
            >
              {pending ? "Saving…" : "Save rules"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
});

export default RulesForm;
