import { discountPct } from "@mumzo/schema";
import { cn } from "@mumzo/ui/lib/utils";
import { Link } from "@tanstack/react-router";
import { Heart, Minus, Plus, Star } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useCart } from "@/modules/cart";
import { useWishlist } from "@/modules/wishlist";
import type { Product } from "../../index";
import ProductVariantDialog from "./product-variant-dialog";

interface ProductCardProps {
  product: Product;
  className?: string;
  /** Routes add-to-cart through the blocking-overlay mutation instead of the
   * default fire-and-forget quick-add — for surfaces like the wishlist page
   * where the user expects clear feedback while the item is added. */
  blocking?: boolean;
}

export default function ProductCard({
  product,
  className,
  blocking = false,
}: ProductCardProps) {
  const { addItem, addItemBlocking, items, updateQty } = useCart();
  const add = blocking ? addItemBlocking : addItem;
  const { has, toggle } = useWishlist();
  const wished = has(product.id);
  const [variantDialogOpen, setVariantDialogOpen] = useState(false);

  const variantCount = product.sizes.length + product.colors.length;
  // 2+ real variants → user must choose on the PDP
  const hasMultipleVariants = variantCount > 1;
  // ≤1 variants (0 = no variants, 1 = single implicit variant) → quick-add from card
  const canQuickAdd = variantCount <= 1;
  // The one real variant, when there is exactly one — its stock/id govern
  // quick-add, not the product-level fields, which don't reflect per-variant
  // inventory.
  const soleVariant = product.sizes[0] ?? product.colors[0] ?? null;
  const isOutOfStock = soleVariant
    ? soleVariant.stock <= 0
    : product.stock <= 0;
  const isSoleSize = Boolean(product.sizes[0]);
  const inCart = items.find(
    (i) =>
      i.productId === product.id &&
      (i.productSizeId ?? null) ===
        (isSoleSize ? (soleVariant?.id ?? null) : null) &&
      (i.productColorId ?? null) ===
        (isSoleSize ? null : (soleVariant?.id ?? null)),
  );

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isOutOfStock || !canQuickAdd) return;
    add(product, soleVariant?.label ?? null);
    toast.success(`${product.name} added to cart!`);
  };

  const handleWish = (e: React.MouseEvent) => {
    e.preventDefault();
    toggle(product.id);
  };

  return (
    <>
      <Link
        to="/product/$productId"
        params={{ productId: product.id }}
        className={cn(
          "group flex h-full flex-col overflow-hidden rounded-2xl border border-border/60 bg-white transition-all hover:-translate-y-1 hover:border-primary/30 hover:shadow-[0_18px_40px_rgba(31,27,58,0.08)]",
          className,
        )}
      >
        <div className="relative aspect-4/3 overflow-hidden bg-accent/10 md:aspect-square">
          <img
            src={product.images[0]}
            alt={product.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          <button
            type="button"
            onClick={handleWish}
            data-testid={`web-wish-${product.id}`}
            aria-label={wished ? "Remove from wishlist" : "Save to wishlist"}
            aria-pressed={wished}
            className="absolute right-3 bottom-3 z-10 flex size-8 cursor-pointer items-center justify-center rounded-full bg-white/95 text-foreground/60 shadow-warm transition-colors hover:text-primary"
          >
            <Heart
              size={15}
              className={cn(wished && "fill-primary text-primary")}
            />
          </button>
          {discountPct(product) > 0 && (
            <span className="absolute top-3 left-3 rounded-full bg-primary px-2.5 py-1 font-semibold text-[10px] text-primary-foreground">
              {discountPct(product)}% OFF
            </span>
          )}
          {isOutOfStock ? (
            <span className="absolute top-3 right-3 rounded-full bg-destructive px-2.5 py-1 font-semibold text-[10px] text-white">
              Out of stock
            </span>
          ) : (
            product.isBestseller && (
              <span className="absolute top-3 right-3 inline-flex items-center gap-1 rounded-full border border-primary/20 bg-white/95 px-2 py-1 font-semibold text-[10px] text-primary">
                <Star
                  size={10}
                  className="fill-current text-primary"
                  strokeWidth={0}
                />{" "}
                Bestseller
              </span>
            )
          )}
        </div>
        <div className="flex flex-1 flex-col p-3 md:p-4">
          <span className="font-semibold text-[10px] text-foreground/50 uppercase tracking-wider">
            {product.brand}
          </span>
          <span className="mt-1 line-clamp-2 block font-medium text-xs leading-snug transition-colors group-hover:text-primary md:text-sm">
            {product.name}
          </span>
          <span className="mt-1 block text-[11px] text-foreground/60 md:text-xs">
            {product.qty}
          </span>
          <div className="mt-auto flex items-end justify-between gap-2 pt-3 md:pt-4">
            <div className="flex flex-col leading-tight">
              <span className="font-semibold text-base text-foreground md:text-lg">
                ₹{product.price}
              </span>
              {product.mrp > product.price && (
                <span className="text-[11px] text-foreground/45 line-through md:text-xs">
                  ₹{product.mrp}
                </span>
              )}
            </div>
            {inCart && canQuickAdd ? (
              /* Already in cart — qty stepper. role="none" prevents the card
               Link from navigating when the inner buttons are clicked. */
              <span
                role="none"
                className="inline-flex items-center overflow-hidden rounded-full bg-primary text-primary-foreground"
              >
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    updateQty(inCart.id, inCart.qty - 1);
                  }}
                  data-testid={`web-qty-minus-${product.id}`}
                  aria-label="Decrease quantity"
                  className="cursor-pointer px-2.5 py-1.5 transition-colors hover:bg-primary/85 md:px-3"
                >
                  <Minus size={14} strokeWidth={3} />
                </button>
                <span
                  data-testid={`web-qty-${product.id}`}
                  className="min-w-5.5 text-center font-semibold text-[11px] md:text-xs"
                >
                  {inCart.qty}
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    updateQty(inCart.id, inCart.qty + 1);
                  }}
                  data-testid={`web-qty-plus-${product.id}`}
                  aria-label="Increase quantity"
                  className="cursor-pointer px-2.5 py-1.5 transition-colors hover:bg-primary/85 md:px-3"
                >
                  <Plus size={14} strokeWidth={3} />
                </button>
              </span>
            ) : hasMultipleVariants && !isOutOfStock ? (
              /* 2+ real variants → open variant selection modal */
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setVariantDialogOpen(true);
                }}
                data-testid={`web-add-${product.id}`}
                className="inline-flex cursor-pointer items-center gap-1 rounded-full bg-primary px-3 py-1.5 font-semibold text-[11px] text-primary-foreground transition-colors hover:bg-primary/95 active:scale-95 md:px-4 md:py-2 md:text-xs"
              >
                Choose options
              </button>
            ) : (
              <button
                type="button"
                onClick={handleAdd}
                disabled={isOutOfStock}
                data-testid={`web-add-${product.id}`}
                className="inline-flex cursor-pointer items-center gap-1 rounded-full bg-primary px-3 py-1.5 font-semibold text-[11px] text-primary-foreground transition-colors hover:bg-primary/95 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 md:px-4 md:py-2 md:text-xs"
              >
                <Plus size={14} strokeWidth={3} />{" "}
                {isOutOfStock ? "Out of stock" : "Add"}
              </button>
            )}
          </div>
        </div>
      </Link>
      <ProductVariantDialog
        product={variantDialogOpen ? product : null}
        onClose={() => setVariantDialogOpen(false)}
        onConfirm={(p, variantLabel) => {
          add(p, variantLabel);
          toast.success(`${p.name} (${variantLabel}) added to cart`);
        }}
      />
    </>
  );
}
