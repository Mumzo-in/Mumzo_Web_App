import { Button } from "@mumzo/ui/components/button";
import { Input } from "@mumzo/ui/components/input";
import { Label } from "@mumzo/ui/components/label";
import { type FormEvent, useState } from "react";

import {
  ADDRESS_LABELS,
  type Address,
  type AddressLabel,
  emptyAddress,
} from "../data/address-data";

type AddressDraft = Omit<Address, "id">;

interface AddressFormProps {
  initial?: Address;
  /** Other saved addresses — used to block a second Home/Work label. */
  existing?: Address[];
  onSubmit: (draft: AddressDraft) => void;
  onCancel?: () => void;
}

export default function AddressForm({
  initial,
  existing = [],
  onSubmit,
  onCancel,
}: AddressFormProps) {
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
  const isLabelDisabled = (label: AddressLabel) => takenLabels.has(label);

  const set = <K extends keyof AddressDraft>(key: K, val: AddressDraft[K]) =>
    setForm((prev) => ({ ...prev, [key]: val }));

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (isLabelDisabled(form.label)) return;
    onSubmit(form as AddressDraft);
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
      {isLabelDisabled(form.label) && (
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
            required
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            value={form.phone}
            onChange={(e) => set("phone", e.target.value)}
            placeholder="98480 12345"
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
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="city">City</Label>
          <Input
            id="city"
            value={form.city}
            onChange={(e) => set("city", e.target.value)}
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
            required
          />
        </div>
      </div>

      <label className="flex cursor-pointer items-center gap-2 text-foreground/70 text-sm">
        <input
          type="checkbox"
          checked={form.isDefault}
          onChange={(e) => set("isDefault", e.target.checked)}
          className="size-4 accent-primary"
        />
        Make this my default address
      </label>

      <div className="flex gap-3 pt-2">
        <Button type="submit" className="flex-1 rounded-full">
          Save address
        </Button>
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="rounded-full"
          >
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}
