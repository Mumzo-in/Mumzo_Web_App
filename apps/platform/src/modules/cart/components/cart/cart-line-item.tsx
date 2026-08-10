import { Checkbox } from "@mumzo/ui/components/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@mumzo/ui/components/dialog";
import {
  NativeSelect,
  NativeSelectOption,
} from "@mumzo/ui/components/native-select";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { ChevronDown, RotateCcw, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { productQueryOptions, toProduct } from "@/modules/catalog";
import { type CartItem, rupee, useCart } from "../../store/cart-provider";

interface CartLineItemProps {
  item: CartItem;
}

export default function CartLineItem({ item }: CartLineItemProps) {
  const { updateQty, removeItem, addItem, toggleSelected } = useCart();
  const [variantDialogOpen, setVariantDialogOpen] = useState(false);
  const discountAmount = (item.mrp - item.price) * item.qty;

  // Needed up front (not just when the dialog opens) to know whether this
  // product has more than one real variant — with ≤1, there's nothing to
  // switch between, so the size trigger shouldn't render at all.
  const { data: rawProduct, isLoading } = useQuery(
    productQueryOptions(item.productId),
  );

  const product = rawProduct ? toProduct(rawProduct) : null;
  const sizes = product?.sizes || [];
  const colors = product?.colors || [];
  const hasMultipleVariants = sizes.length + colors.length > 1;

  const handleSelectVariant = (variantLabel: string) => {
    if (variantLabel === item.variantLabel) {
      setVariantDialogOpen(false);
      return;
    }
    if (!product) return;

    // Optimistically remove and re-add the item under the new variant
    removeItem(item.id);
    addItem(product, variantLabel, item.qty);
    toast.success(`Size/Variant updated to ${variantLabel}`);
    setVariantDialogOpen(false);
  };

  return (
    <div
      data-testid={`web-cart-item-${item.id}`}
      className="relative flex gap-3 rounded-3xl border border-border/60 bg-white p-4 sm:gap-4 sm:p-5"
    >
      {/* Checkbox and image container */}
      <div className="flex items-start gap-3">
        <div className="mt-1.5">
          <Checkbox
            checked={item.selected}
            onCheckedChange={(checked) =>
              toggleSelected(item.id, checked === true)
            }
            aria-label="Select item"
            data-testid={`web-cart-item-select-${item.id}`}
          />
        </div>
        <Link
          to="/product/$productId"
          params={{ productId: item.productId }}
          className="relative shrink-0 overflow-hidden rounded-2xl"
        >
          <img
            src={item.img ?? ""}
            alt={item.name}
            className="size-24 object-cover transition-transform duration-300 hover:scale-105 sm:size-28 md:size-32"
          />
        </Link>
      </div>

      <div className="flex min-w-0 flex-1 flex-col pr-6">
        <p className="font-semibold text-[10px] text-foreground/50 uppercase tracking-wider">
          {item.brand}
        </p>
        <Link
          to="/product/$productId"
          params={{ productId: item.productId }}
          className="mt-0.5 line-clamp-1 font-editorial text-base text-ink leading-snug hover:underline"
        >
          {item.name}
        </Link>
        <p className="mt-0.5 text-[11px] text-foreground/55">
          Sold by: {item.brand || "Mumzo Retail"}
        </p>

        {/* Dropdowns for Size and Qty */}
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {/* Interactive Size Trigger Button — only when there's an actual
              choice; a single/no-variant product has nothing to switch to. */}
          {hasMultipleVariants && (
            <button
              type="button"
              onClick={() => setVariantDialogOpen(true)}
              className="inline-flex h-8 cursor-pointer items-center gap-1 rounded-lg border-none bg-secondary/60 px-2.5 py-1 font-semibold text-ink text-xs transition-colors hover:bg-secondary"
            >
              <span>Size: {item.variantLabel}</span>
              <ChevronDown size={13} className="text-muted-foreground" />
            </button>
          )}

          <NativeSelect
            value={item.qty}
            onChange={(e) => updateQty(item.id, Number(e.target.value))}
            className="h-8 w-fit rounded-lg border-none bg-secondary/60 font-semibold text-ink"
          >
            {Array.from({ length: Math.min(10, item.stock || 10) }).map(
              (_, i) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: options are static and never reordered
                <NativeSelectOption key={i + 1} value={i + 1}>
                  Qty: {i + 1}
                </NativeSelectOption>
              ),
            )}
          </NativeSelect>
        </div>

        {item.isOutOfStock && (
          <p className="mt-1 font-medium text-destructive text-xs">
            Out of stock — remove to continue
          </p>
        )}

        <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="font-bold text-ink text-sm sm:text-base">
            {rupee(item.price * item.qty)}
          </span>
          {item.mrp > item.price && (
            <>
              <span className="text-foreground/45 text-xs line-through">
                {rupee(item.mrp * item.qty)}
              </span>
              <span className="font-semibold text-primary text-xs">
                {rupee(discountAmount)} OFF
              </span>
            </>
          )}
        </div>

        {/* Return / Delivery Policy Note */}
        <p className="mt-2.5 flex items-center gap-1.5 text-[11px] text-foreground/60">
          <RotateCcw size={12} className="text-foreground/60" />
          <span>14 days return available</span>
        </p>
      </div>

      {/* Absolute top-right close button */}
      <button
        type="button"
        onClick={() => removeItem(item.id)}
        aria-label="Remove item"
        className="absolute top-3 right-3 rounded-full p-1.5 text-foreground/40 transition-colors hover:bg-secondary/80 hover:text-ink"
      >
        <X size={16} />
      </button>

      {/* Size / Variant Picker Dialog */}
      <Dialog open={variantDialogOpen} onOpenChange={setVariantDialogOpen}>
        <DialogContent className="p-6 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-bold font-editorial text-ink text-lg leading-snug">
              Select Variation
            </DialogTitle>
          </DialogHeader>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center gap-3 py-10">
              <div className="h-7 w-7 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <p className="font-semibold text-foreground/50 text-xs">
                Loading variations…
              </p>
            </div>
          ) : sizes.length === 0 && colors.length === 0 ? (
            <p className="py-6 text-center text-muted-foreground text-xs">
              No other variations available for this item.
            </p>
          ) : (
            <div className="mt-2 flex flex-col gap-4">
              <p className="font-medium text-foreground/60 text-xs leading-normal">
                Choose a size or color to update your selection for{" "}
                <span className="font-semibold text-ink">{item.name}</span>:
              </p>

              {/* Sizes section */}
              {sizes.length > 0 && (
                <div className="flex flex-col gap-2">
                  <p className="font-bold text-[10px] text-foreground/50 uppercase tracking-widest">
                    Available Sizes
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {sizes.map((s) => {
                      const isSelected = s.label === item.variantLabel;
                      const isOos = s.stock === 0;

                      return (
                        <button
                          key={s.label}
                          type="button"
                          disabled={isOos}
                          onClick={() => handleSelectVariant(s.label)}
                          className={`flex cursor-pointer flex-col items-center justify-center gap-0.5 rounded-xl border px-3 py-2.5 font-semibold text-xs transition-colors ${
                            isSelected
                              ? "border-primary bg-primary text-primary-foreground"
                              : isOos
                                ? "cursor-not-allowed border-border bg-secondary/30 text-foreground/35 line-through"
                                : "border-border bg-card text-foreground/85 hover:border-primary"
                          }`}
                        >
                          <span>{s.label}</span>
                          <span className="font-normal text-[9px] opacity-80">
                            {rupee(s.price)}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Colors section */}
              {sizes.length === 0 && colors.length > 0 && (
                <div className="flex flex-col gap-2">
                  <p className="font-bold text-[10px] text-foreground/50 uppercase tracking-widest">
                    Available Colors
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {colors.map((c) => {
                      const isSelected = c.label === item.variantLabel;
                      const isOos = c.stock === 0;

                      return (
                        <button
                          key={c.label}
                          type="button"
                          disabled={isOos}
                          onClick={() => handleSelectVariant(c.label)}
                          className={`flex cursor-pointer flex-col items-center justify-center gap-0.5 rounded-xl border px-3 py-2.5 font-semibold text-xs transition-colors ${
                            isSelected
                              ? "border-primary bg-primary text-primary-foreground"
                              : isOos
                                ? "cursor-not-allowed border-border bg-secondary/30 text-foreground/35 line-through"
                                : "border-border bg-card text-foreground/85 hover:border-primary"
                          }`}
                        >
                          <span>{c.label}</span>
                          <span className="font-normal text-[9px] opacity-80">
                            {rupee(c.price)}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
