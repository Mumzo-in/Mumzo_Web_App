import { cn } from "@mumzo/ui/lib/utils";
import { Link } from "@tanstack/react-router";
import { Plus, Star } from "lucide-react";
import { toast } from "sonner";
import type { Product } from "../index";

interface ProductCardProps {
  product: Product;
  className?: string;
}

export default function ProductCard({ product, className }: ProductCardProps) {
  const handleAdd = () => {
    toast.success(`${product.name} added to cart!`);
  };

  return (
    <div
      className={cn(
        "group flex h-full flex-col overflow-hidden rounded-2xl border border-border/60 bg-white transition-all hover:-translate-y-1 hover:border-primary/30 hover:shadow-[0_18px_40px_rgba(31,27,58,0.08)]",
        className,
      )}
    >
      <Link
        to="/product/$productId"
        params={{ productId: product.id }}
        className="relative block aspect-4/3 overflow-hidden bg-accent/10 md:aspect-square"
      >
        <img
          src={product.img}
          alt={product.name}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        {product.discount > 0 && (
          <span className="absolute top-3 left-3 rounded-full bg-primary px-2.5 py-1 font-semibold text-[10px] text-primary-foreground">
            {product.discount}% OFF
          </span>
        )}
        {product.bestseller && (
          <span className="absolute top-3 right-3 inline-flex items-center gap-1 rounded-full border border-primary/20 bg-white/95 px-2 py-1 font-semibold text-[10px] text-primary">
            <Star
              size={10}
              className="fill-current text-primary"
              strokeWidth={0}
            />{" "}
            Bestseller
          </span>
        )}
      </Link>
      <div className="flex flex-1 flex-col p-3 md:p-4">
        <Link
          to="/product/$productId"
          params={{ productId: product.id }}
          className="block"
        >
          <span className="font-semibold text-[10px] text-foreground/50 uppercase tracking-wider">
            {product.brand}
          </span>
          <span className="mt-1 line-clamp-2 block font-medium text-xs leading-snug transition-colors hover:text-primary md:text-sm">
            {product.name}
          </span>
          <span className="mt-1 block text-[11px] text-foreground/60 md:text-xs">
            {product.qty}
          </span>
        </Link>
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
          <button
            type="button"
            onClick={handleAdd}
            data-testid={`web-add-${product.id}`}
            className="inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1.5 font-semibold text-[11px] text-primary-foreground transition-colors hover:bg-primary/95 active:scale-95 md:px-4 md:py-2 md:text-xs"
          >
            <Plus size={14} strokeWidth={3} /> Add
          </button>
        </div>
      </div>
    </div>
  );
}
