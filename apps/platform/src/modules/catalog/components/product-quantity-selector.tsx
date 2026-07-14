import { Minus, Plus } from "lucide-react";

interface ProductQuantitySelectorProps {
  qty: number;
  onQtyChange: (qty: number) => void;
}

export default function ProductQuantitySelector({
  qty,
  onQtyChange,
}: ProductQuantitySelectorProps) {
  return (
    <div className="mt-6">
      <p className="mb-3 font-semibold text-foreground/60 text-xs uppercase tracking-widest">
        Quantity
      </p>
      <div className="inline-flex items-center gap-1 rounded-full border border-primary/10 bg-accent/20 p-1">
        <button
          type="button"
          onClick={() => onQtyChange(Math.max(1, qty - 1))}
          data-testid="qty-minus"
          className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-white text-primary transition-colors hover:bg-accent/10"
        >
          <Minus size={16} strokeWidth={3} />
        </button>
        <span
          data-testid="qty-value"
          className="min-w-[40px] text-center font-semibold text-primary"
        >
          {qty}
        </span>
        <button
          type="button"
          onClick={() => onQtyChange(qty + 1)}
          data-testid="qty-plus"
          className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-white text-primary transition-colors hover:bg-accent/10"
        >
          <Plus size={16} strokeWidth={3} />
        </button>
      </div>
    </div>
  );
}
