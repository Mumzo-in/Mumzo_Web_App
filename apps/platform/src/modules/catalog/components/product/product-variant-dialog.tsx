import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@mumzo/ui/components/dialog";
import { useEffect, useState } from "react";

import { rupee } from "@/modules/cart";
import type { Product } from "../../index";

interface ProductVariantDialogProps {
  product: Product | null;
  onClose: () => void;
  onConfirm: (product: Product, selectedVariantLabel: string) => void;
}

export default function ProductVariantDialog({
  product,
  onClose,
  onConfirm,
}: ProductVariantDialogProps) {
  const [selectedVariant, setSelectedVariant] = useState<string | null>(null);

  useEffect(() => {
    if (product) {
      const firstInStockSize =
        product.sizes.find((s) => s.stock > 0) ?? product.sizes[0];
      const firstInStockColor = !firstInStockSize
        ? (product.colors.find((c) => c.stock > 0) ?? product.colors[0])
        : undefined;
      setSelectedVariant(
        firstInStockSize?.label ?? firstInStockColor?.label ?? null,
      );
    } else {
      setSelectedVariant(null);
    }
  }, [product]);

  if (!product) return null;

  const isAllSizes = product.sizes.length > 0;
  const label = isAllSizes ? "Select Size" : "Select Option";

  return (
    <Dialog open={Boolean(product)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        onClick={(e) => e.stopPropagation()}
        className="w-[calc(100vw-2rem)] max-w-sm rounded-3xl bg-white p-5 shadow-warm"
      >
        <DialogHeader>
          <DialogTitle className="font-editorial text-ink text-xl">
            {label}
          </DialogTitle>
          <DialogDescription className="text-foreground/60 text-xs">
            Choose your preferred variant to add to your cart.
          </DialogDescription>
        </DialogHeader>

        <div className="my-2 flex gap-3">
          <img
            src={product.images[0] ?? ""}
            alt={product.name}
            className="size-16 rounded-xl object-cover"
          />
          <div className="flex min-w-0 flex-1 flex-col justify-center">
            <p className="truncate font-semibold text-ink text-sm">
              {product.name}
            </p>
            <p className="mt-0.5 font-bold text-ink text-sm">
              {rupee(product.price)}
            </p>
          </div>
        </div>

        {/* Sizes */}
        {product.sizes.length > 0 && (
          <div className="mt-2">
            <p className="mb-2 font-semibold text-foreground/60 text-xs uppercase tracking-wider">
              Available Sizes
            </p>
            <div className="flex flex-wrap gap-2">
              {product.sizes.map((s) => {
                const isOutOfStock = s.stock <= 0;
                const selected = selectedVariant === s.label;
                return (
                  <button
                    key={s.id}
                    type="button"
                    disabled={isOutOfStock}
                    onClick={() => setSelectedVariant(s.label)}
                    className={`cursor-pointer rounded-full border px-3.5 py-1.5 font-medium text-xs transition-all ${
                      selected
                        ? "border-primary bg-primary text-primary-foreground"
                        : isOutOfStock
                          ? "cursor-not-allowed border-border/40 bg-secondary/20 text-foreground/40 line-through"
                          : "border-border/70 bg-white text-foreground hover:border-primary"
                    }`}
                  >
                    {s.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Colors */}
        {product.colors.length > 0 && (
          <div className="mt-3">
            <p className="mb-2 font-semibold text-foreground/60 text-xs uppercase tracking-wider">
              Available Colors
            </p>
            <div className="flex flex-wrap gap-2">
              {product.colors.map((c) => {
                const isOutOfStock = c.stock <= 0;
                const selected = selectedVariant === c.label;
                return (
                  <button
                    key={c.id}
                    type="button"
                    disabled={isOutOfStock}
                    onClick={() => setSelectedVariant(c.label)}
                    className={`cursor-pointer rounded-full border px-3.5 py-1.5 font-medium text-xs transition-all ${
                      selected
                        ? "border-primary bg-primary text-primary-foreground"
                        : isOutOfStock
                          ? "cursor-not-allowed border-border/40 bg-secondary/20 text-foreground/40 line-through"
                          : "border-border/70 bg-white text-foreground hover:border-primary"
                    }`}
                  >
                    {c.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <button
          type="button"
          disabled={!selectedVariant}
          onClick={() => {
            if (selectedVariant) {
              onConfirm(product, selectedVariant);
              onClose();
            }
          }}
          className="mt-5 w-full cursor-pointer rounded-full bg-primary py-3 font-semibold text-primary-foreground text-sm transition-colors hover:bg-primary/95 disabled:opacity-50"
        >
          Add to Cart
        </button>
      </DialogContent>
    </Dialog>
  );
}
