import { Link } from "react-router-dom";
import { Plus, Star } from "lucide-react";
import { useCart, rupee } from "../shop/CartContext";

export default function WebProductCard({ product }) {
  const { addItem, items, updateQty } = useCart();
  const inCart = items.find((i) => i.id === product.id && !i.size);

  return (
    <div className="group flex flex-col rounded-2xl bg-white border border-border/60 overflow-hidden transition-all hover:shadow-[0_18px_40px_rgba(45,23,32,0.08)] hover:-translate-y-1 hover:border-rose/60">
      <Link to={`/web/product/${product.id}`} className="relative aspect-square bg-blush/40 overflow-hidden">
        <img src={product.img} alt={product.name} loading="lazy" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
        {product.discount > 0 && (
          <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-pinkDeep text-white text-[10px] font-semibold">
            {product.discount}% OFF
          </span>
        )}
        {product.bestseller && (
          <span className="absolute top-3 right-3 px-2 py-1 rounded-full bg-white/95 text-pinkDeep text-[10px] font-semibold border border-rose/40 inline-flex items-center gap-1">
            <Star size={10} fill="currentColor" strokeWidth={0} /> Bestseller
          </span>
        )}
      </Link>
      <div className="flex flex-col flex-1 p-4">
        <Link to={`/web/product/${product.id}`} className="block">
          <span className="text-[10px] uppercase tracking-wider text-foreground/50 font-semibold">{product.brand}</span>
          <span className="mt-1 block text-sm font-medium leading-snug line-clamp-2 hover:text-pinkDeep transition-colors">{product.name}</span>
          <span className="mt-1 block text-xs text-foreground/60">{product.qty}</span>
        </Link>
        <div className="mt-auto flex items-end justify-between gap-2 pt-4">
          <div className="flex flex-col leading-tight">
            <span className="font-semibold text-lg text-foreground">{rupee(product.price)}</span>
            {product.mrp > product.price && (
              <span className="text-xs text-foreground/45 line-through">{rupee(product.mrp)}</span>
            )}
          </div>
          {inCart ? (
            <div className="inline-flex items-center rounded-full bg-blush border border-rose/50 overflow-hidden">
              <button onClick={() => updateQty(inCart.key, inCart.qty - 1)} className="px-3 py-1.5 text-pinkDeep font-semibold">−</button>
              <span className="px-1.5 text-sm text-pinkDeep font-semibold min-w-[20px] text-center">{inCart.qty}</span>
              <button onClick={() => updateQty(inCart.key, inCart.qty + 1)} className="px-3 py-1.5 text-pinkDeep font-semibold">+</button>
            </div>
          ) : (
            <button
              onClick={() => addItem(product)}
              data-testid={`web-add-${product.id}`}
              className="inline-flex items-center gap-1 px-4 py-2 rounded-full bg-pinkDeep text-white text-xs font-semibold hover:bg-[#A93F63] transition-colors"
            >
              <Plus size={14} strokeWidth={3} /> Add
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
