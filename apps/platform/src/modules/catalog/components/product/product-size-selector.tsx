interface ProductSizeSelectorProps {
  sizes: string[];
  selectedSize: string | null;
  onSelectSize: (size: string) => void;
}

export default function ProductSizeSelector({
  sizes,
  selectedSize,
  onSelectSize,
}: ProductSizeSelectorProps) {
  const isAllSizes = sizes.every((s) =>
    /^(s|m|l|xl|xxl|\d+-\d+[mya-z+]*|\d+[mya-z+]*|pack of \d+|combo of \d+|\d+\s*ml)$/i.test(
      s.trim(),
    ),
  );
  const displayLabel = isAllSizes ? "Choose size" : "Choose option";

  return (
    <div className="mt-6">
      <p className="mb-3 font-semibold text-foreground/60 text-xs uppercase tracking-widest">
        {displayLabel}
      </p>
      <div className="flex flex-wrap gap-2">
        {sizes.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => onSelectSize(s)}
            data-testid={`size-${s}`}
            className={`min-w-[56px] cursor-pointer rounded-full border px-4 py-2.5 font-medium text-sm transition-all ${
              selectedSize === s
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border/70 bg-white text-foreground hover:border-primary"
            }`}
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}
