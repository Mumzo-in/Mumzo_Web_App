import { Check, MapPin, Pencil, Star, Trash2 } from "lucide-react";

import type { Address } from "../data/address-data";

interface AddressCardProps {
  address: Address;
  selectable?: boolean;
  selected?: boolean;
  onSelect?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onSetDefault?: () => void;
}

export default function AddressCard({
  address,
  selectable = false,
  selected = false,
  onSelect,
  onEdit,
  onDelete,
  onSetDefault,
}: AddressCardProps) {
  const body = (
    <>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/40 px-2.5 py-1 font-semibold text-ink text-xs">
            <MapPin size={12} />
            {address.label}
          </span>
          {address.isDefault && (
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 font-semibold text-primary text-xs">
              <Star size={11} />
              Default
            </span>
          )}
        </div>
        {selectable && (
          <span
            className={`flex size-5 shrink-0 items-center justify-center rounded-full border transition-colors ${
              selected
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border"
            }`}
          >
            {selected && <Check size={12} />}
          </span>
        )}
      </div>

      <p className="mt-3 font-semibold text-ink text-sm">{address.name}</p>
      <p className="mt-1 text-foreground/70 text-sm leading-relaxed">
        {address.line1}, {address.line2}
        {address.landmark ? `, ${address.landmark}` : ""}
        <br />
        {address.city} — {address.pincode}
      </p>
      <p className="mt-2 text-foreground/60 text-sm">Phone: {address.phone}</p>
    </>
  );

  const base =
    "block rounded-3xl border bg-white p-5 text-left transition-colors";
  const state = selected
    ? "border-primary ring-1 ring-primary/30"
    : "border-border/60 hover:border-primary/40";

  if (selectable) {
    return (
      <button
        type="button"
        onClick={onSelect}
        data-testid={`web-address-${address.id}`}
        className={`${base} ${state} w-full cursor-pointer`}
      >
        {body}
      </button>
    );
  }

  return (
    <div className={`${base} ${state}`}>
      {body}
      <div className="mt-4 flex flex-wrap items-center gap-2 border-border/60 border-t pt-4">
        {onEdit && (
          <button
            type="button"
            onClick={onEdit}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-border px-3 py-1.5 font-semibold text-foreground/70 text-xs transition-colors hover:bg-secondary"
          >
            <Pencil size={12} />
            Edit
          </button>
        )}
        {!address.isDefault && onSetDefault && (
          <button
            type="button"
            onClick={onSetDefault}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-border px-3 py-1.5 font-semibold text-foreground/70 text-xs transition-colors hover:bg-secondary"
          >
            <Star size={12} />
            Set default
          </button>
        )}
        {onDelete && (
          <button
            type="button"
            onClick={onDelete}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-destructive/30 px-3 py-1.5 font-semibold text-destructive text-xs transition-colors hover:bg-destructive/10"
          >
            <Trash2 size={12} />
            Delete
          </button>
        )}
      </div>
    </div>
  );
}
