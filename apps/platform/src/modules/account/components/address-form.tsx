import { Button } from "@mumzo/ui/components/button";
import { Input } from "@mumzo/ui/components/input";
import { Label } from "@mumzo/ui/components/label";
import { Loader2 } from "lucide-react";
import { type FormEvent, useState } from "react";

import { authClient } from "@/modules/auth";
import {
  ADDRESS_LABELS,
  type Address,
  type AddressLabel,
  emptyAddress,
} from "../data/address-data";

type AddressDraft = Omit<Address, "id">;

/** Account phone is stored E.164 (`+91XXXXXXXXXX`, see `sign-in-form.tsx`'s
 * `toE164`) — display it in the same "XXXXX XXXXX" shape the rest of the
 * address book uses instead of the raw dialing format. */
function formatAccountPhone(phoneNumber: string) {
  const digits = phoneNumber.replace(/^\+91/, "");
  if (digits.length !== 10) return digits;
  return `${digits.slice(0, 5)} ${digits.slice(5)}`;
}

interface AddressFormProps {
  initial?: Address;
  /** Other saved addresses — used to block a second Home/Work label. */
  existing?: Address[];
  onSubmit: (draft: AddressDraft) => void | Promise<void>;
  onCancel?: () => void;
}

export default function AddressForm({
  initial,
  existing = [],
  onSubmit,
  onCancel,
}: AddressFormProps) {
  const { data: session } = authClient.useSession();
  const user = session?.user;
  const accountPhone =
    user && "phoneNumber" in user && typeof user.phoneNumber === "string"
      ? formatAccountPhone(user.phoneNumber)
      : undefined;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState(() => ({
    ...emptyAddress(),
    ...initial,
    isDefault: initial?.isDefault ?? false,
  }));

  // Home/Work are one-per-user; Other can repeat.
  const takenLabels = new Set(
    existing
      .filter((a) => a.id !== initial?.id && a.label !== "Other")
      .map((a) => a.label),
  );
  const isLabelDisabled = (label: AddressLabel) =>
    takenLabels.has(label) || isSubmitting;

  const set = <K extends keyof AddressDraft>(key: K, val: AddressDraft[K]) =>
    setForm((prev) => ({ ...prev, [key]: val }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (isLabelDisabled(form.label) || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onSubmit(form as AddressDraft);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex gap-2">
        {ADDRESS_LABELS.map((label) => {
          const disabled = isLabelDisabled(label);
          return (
            <button
              key={label}
              type="button"
              disabled={disabled}
              onClick={() => set("label", label as AddressLabel)}
              title={
                disabled ? `You already have a ${label} address` : undefined
              }
              className={`flex-1 cursor-pointer rounded-full border px-4 py-2 font-semibold text-sm transition-colors ${
                disabled
                  ? "cursor-not-allowed border-border/60 text-foreground/30"
                  : form.label === label
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border text-foreground/70 hover:bg-secondary"
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>
      {isLabelDisabled(form.label) && !isSubmitting && (
        <p className="text-destructive text-xs">
          You already have a {form.label} address — save this one under "Other"
          instead.
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="name">Full name</Label>
          <Input
            id="name"
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="Ananya Reddy"
            disabled={isSubmitting}
            required
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="phone">Phone</Label>
            {accountPhone && accountPhone !== form.phone && (
              <button
                type="button"
                onClick={() => set("phone", accountPhone)}
                disabled={isSubmitting}
                data-testid="web-use-account-phone"
                className="cursor-pointer font-semibold text-primary text-xs hover:text-primary/80 disabled:opacity-50"
              >
                Use my number
              </button>
            )}
          </div>
          <Input
            id="phone"
            value={form.phone}
            onChange={(e) => set("phone", e.target.value)}
            placeholder="98480 12345"
            disabled={isSubmitting}
            required
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="line1">Flat / House no. & building</Label>
        <Input
          id="line1"
          value={form.line1}
          onChange={(e) => set("line1", e.target.value)}
          placeholder="Flat 402, Lotus Residency"
          disabled={isSubmitting}
          required
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="line2">Area / Street / Sector</Label>
        <Input
          id="line2"
          value={form.line2}
          onChange={(e) => set("line2", e.target.value)}
          placeholder="Road No. 12, Banjara Hills"
          disabled={isSubmitting}
          required
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="landmark">Landmark (optional)</Label>
        <Input
          id="landmark"
          value={form.landmark}
          onChange={(e) => set("landmark", e.target.value)}
          placeholder="Opp. GVK One Mall"
          disabled={isSubmitting}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="city">City</Label>
          <Input
            id="city"
            value={form.city}
            onChange={(e) => set("city", e.target.value)}
            disabled={isSubmitting}
            required
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="pincode">Pincode</Label>
          <Input
            id="pincode"
            value={form.pincode}
            onChange={(e) => set("pincode", e.target.value)}
            placeholder="500034"
            disabled={isSubmitting}
            required
          />
        </div>
      </div>

      <label className="flex cursor-pointer items-center gap-2 text-foreground/70 text-sm">
        <input
          type="checkbox"
          checked={form.isDefault}
          onChange={(e) => set("isDefault", e.target.checked)}
          disabled={isSubmitting}
          className="size-4 accent-primary"
        />
        Make this my default address
      </label>

      <div className="flex gap-3 pt-2">
        <Button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 rounded-full"
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="size-4 animate-spin" />
              Saving…
            </span>
          ) : (
            "Save address"
          )}
        </Button>
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
            className="rounded-full"
          >
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}
