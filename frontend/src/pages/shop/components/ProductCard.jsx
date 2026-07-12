import { Link } from "react-router-dom";
import { Plus, Star } from "lucide-react";
import { useCart, rupee } from "../CartContext";

export default function ProductCard({ product, testid }) {
  const { addItem, items, updateQty } = useCart();
  const inCart = items.find((i) => i.id === product.id && !i.size);

  return (
    <Link
      to={`/app/product/${product.id}`}
      data-testid={testid || `product-${product.id}`}
      className="group flex flex-col rounded-2xl bg-white border border-border/60 overflow-hidden active:scale-[0.98] transition-transform"
    >
      <div className="relative aspect-square bg-blush/40 overflow-hidden">
        <img src={product.img} alt={product.name} loading="lazy" className="w-full h-full object-cover" />
        {product.discount > 0 && (
          <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-pinkDeep text-white text-[10px] font-semibold">
            {product.discount}% OFF
          </span>
        )}
        {product.bestseller && (
          <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-white/95 text-pinkDeep text-[10px] font-semibold border border-rose/40 inline-flex items-center gap-1">
            <Star size={10} fill="currentColor" strokeWidth={0} /> Bestseller
          </span>
        )}
      </div>
      <div className="flex flex-col flex-1 p-3">
        <span className="text-[10px] uppercase tracking-wider text-foreground/50">{product.brand}</span>
        <span className="mt-0.5 text-sm font-medium leading-snug line-clamp-2">{product.name}</span>
        <span className="mt-1 text-xs text-foreground/60">{product.qty}</span>

        <div className="mt-auto flex items-end justify-between gap-2 pt-3">
          <div className="flex flex-col leading-tight">
            <span className="font-semibold text-foreground">{rupee(product.price)}</span>
            {product.mrp > product.price && (
              <span className="text-[11px] text-foreground/45 line-through">{rupee(product.mrp)}</span>
            )}
          </div>
          {inCart ? (
            <div className="flex items-center rounded-full bg-blush border border-rose/50 overflow-hidden">
              <button
                type="button"
                onClick={(e) => { e.preventDefault(); updateQty(inCart.key, inCart.qty - 1); }}
                className="px-2.5 py-1.5 text-pinkDeep font-semibold"
              >−</button>
              <span className="px-1 text-sm text-pinkDeep font-semibold min-w-[18px] text-center">{inCart.qty}</span>
              <button
                type="button"
                onClick={(e) => { e.preventDefault(); updateQty(inCart.key, inCart.qty + 1); }}
                className="px-2.5 py-1.5 text-pinkDeep font-semibold"
              >+</button>
            </div>
          ) : (
            <button
              type="button"
              onClick={(e) => { e.preventDefault(); addItem(product); }}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-pinkDeep text-white text-xs font-semibold active:scale-95 transition-transform"
            >
              <Plus size={14} strokeWidth={3} /> Add
            </button>
          )}
        </div>
      </div>
    </Link>
  );
}
