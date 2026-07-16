import { cn } from "@mumzo/ui/lib/utils";

type StatusChipProps = {
  label: string;
  /** Token-based tint from the owning module's STATUS_META. */
  tint: string;
};

/** Small state pill for order/payment/product status columns. */
export function StatusChip({ label, tint }: StatusChipProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 font-medium text-xs",
        tint,
      )}
      data-testid="admin-status-chip"
    >
      {label}
    </span>
  );
}

export default StatusChip;
