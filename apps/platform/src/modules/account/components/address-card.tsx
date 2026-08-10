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
    <div className="flex min-w-0 flex-1 items-start gap-3">
      <MapPin size={16} className="mt-0.5 shrink-0 text-primary" />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="font-bold text-ink text-sm">{address.label}</span>
          {address.isDefault && (
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 font-semibold text-[10px] text-primary">
              <Star size={10} />
              Default
            </span>
          )}
          <span className="text-foreground/60 text-xs">· {address.name}</span>
        </div>
        <p className="truncate text-foreground/60 text-xs leading-normal">
          {address.line1}, {address.line2}
          {address.landmark ? `, ${address.landmark}` : ""}, {address.city} —{" "}
          {address.pincode}
        </p>
      </div>
    </div>
  );

  const base =
    "flex w-full items-center gap-3 rounded-2xl border bg-white px-4 py-3 transition-colors";
  const state = selected
    ? "border-primary ring-1 ring-primary/30"
    : "border-border/60 hover:border-primary/40";

  const hasActions = Boolean(
    onEdit || onDelete || (onSetDefault && !address.isDefault),
  );

  return (
    <div className={`${base} ${state}`}>
      {selectable ? (
        <button
          type="button"
          onClick={onSelect}
          data-testid={`web-address-${address.id}`}
          className="flex min-w-0 flex-1 cursor-pointer items-center gap-3 text-left"
        >
          {body}
          <span
            className={`flex size-5 shrink-0 items-center justify-center rounded-full border transition-colors ${
              selected
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border"
            }`}
          >
            {selected && <Check size={12} />}
          </span>
        </button>
      ) : (
        body
      )}
      {hasActions && (
        <div className="flex shrink-0 items-center gap-1">
          {onEdit && (
            <button
              type="button"
              onClick={onEdit}
              aria-label="Edit address"
              className="flex size-8 cursor-pointer items-center justify-center rounded-full text-foreground/60 transition-colors hover:bg-secondary hover:text-foreground"
            >
              <Pencil size={14} />
            </button>
          )}
          {!address.isDefault && onSetDefault && (
            <button
              type="button"
              onClick={onSetDefault}
              aria-label="Set as default"
              className="flex size-8 cursor-pointer items-center justify-center rounded-full text-foreground/60 transition-colors hover:bg-secondary hover:text-foreground"
            >
              <Star size={14} />
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              onClick={onDelete}
              aria-label="Delete address"
              className="flex size-8 cursor-pointer items-center justify-center rounded-full text-destructive/70 transition-colors hover:bg-destructive/10 hover:text-destructive"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
