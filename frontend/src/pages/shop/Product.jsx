import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Heart, Share2, Star, Truck, ShieldCheck, RotateCcw, ChevronDown, Minus, Plus } from "lucide-react";
import { findProduct, findCategory } from "./data";
import { useCart, rupee } from "./CartContext";

const AllSizes = ["XS", "S", "M", "L", "XL", "XXL", "0-3M", "3-6M", "6-9M", "1-2Y"];

export default function Product() {
  const { id } = useParams();
  const nav = useNavigate();
  const product = findProduct(id);
  const category = product ? findCategory(product.categorySlug) : null;
  const { addItem } = useCart();

  const [size, setSize] = useState(product?.sizes || null);
  const [qty, setQty] = useState(1);
  const [openAbout, setOpenAbout] = useState(true);
  const [openHighlights, setOpenHighlights] = useState(false);
  const [saved, setSaved] = useState(false);

  if (!product) return <div className="p-6">Product not found.</div>;

  const availableSizes = AllSizes.slice(0, product.categorySlug === "clothing" ? 5 : 4);

  const handleAdd = () => {
    addItem(product, size, qty);
    nav("/app/cart");
  };

  return (
    <div data-testid="product-page" className="pb-32">
      {/* Header */}
      <header className="sticky top-0 z-30 flex items-center justify-between px-4 py-3 bg-background/85 backdrop-blur border-b border-border/40">
        <Link to={`/app/category/${product.categorySlug}`} data-testid="back-btn" className="w-9 h-9 rounded-full bg-white border border-border/60 flex items-center justify-center">
          <ArrowLeft size={18} />
        </Link>
        <div className="flex gap-2">
          <button onClick={() => setSaved(!saved)} data-testid="wishlist-btn" className="w-9 h-9 rounded-full bg-white border border-border/60 flex items-center justify-center">
            <Heart size={18} fill={saved ? "#C85277" : "none"} color={saved ? "#C85277" : "currentColor"} />
          </button>
          <button className="w-9 h-9 rounded-full bg-white border border-border/60 flex items-center justify-center">
            <Share2 size={18} />
          </button>
        </div>
      </header>

      {/* Image */}
      <div className="relative aspect-square bg-blush/40 mx-4 mt-4 rounded-3xl overflow-hidden">
        <img src={product.img} alt={product.name} className="w-full h-full object-cover" />
        {product.discount > 0 && (
          <span className="absolute top-3 left-3 px-3 py-1 rounded-full bg-pinkDeep text-white text-xs font-bold">
            {product.discount}% OFF
          </span>
        )}
      </div>

      {/* Info */}
      <div className="px-5 pt-5">
        <p className="text-[11px] uppercase tracking-widest text-pinkDeep font-semibold">{product.brand}</p>
        <h1 className="mt-1 font-editorial text-2xl leading-tight">{product.name}</h1>
        <p className="mt-1 text-sm text-foreground/60">{product.qty}</p>

        <div className="mt-3 flex items-center gap-2">
          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blush">
            <Star size={12} fill="#C85277" strokeWidth={0} />
            <span className="text-xs font-semibold text-pinkDeep">{product.rating}</span>
          </div>
          <span className="text-xs text-foreground/50">2.3k reviews</span>
        </div>

        <div className="mt-4 flex items-end gap-3">
          <span className="font-editorial text-3xl">{rupee(product.price)}</span>
          {product.mrp > product.price && (
            <>
              <span className="text-sm text-foreground/45 line-through mb-1">{rupee(product.mrp)}</span>
              <span className="text-sm text-pinkDeep font-semibold mb-1">{product.discount}% off</span>
            </>
          )}
        </div>
        <p className="text-xs text-foreground/55 mt-1">Inclusive of all taxes</p>

        {/* Size selector */}
        {(product.categorySlug === "clothing" || product.categorySlug === "diapers" || product.categorySlug === "nursery") && (
          <div className="mt-6">
            <p className="text-xs font-semibold uppercase tracking-widest text-foreground/60 mb-3">Choose size</p>
            <div className="flex gap-2 flex-wrap">
              {availableSizes.map(s => (
                <button
                  key={s}
                  onClick={() => setSize(s)}
                  data-testid={`size-${s}`}
                  className={`min-w-[52px] px-4 py-2 rounded-full text-sm font-medium border ${
                    size === s ? "bg-pinkDeep text-white border-pinkDeep" : "bg-white text-foreground border-border/70"
                  }`}
                >{s}</button>
              ))}
            </div>
          </div>
        )}

        {/* Quantity */}
        <div className="mt-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-foreground/60 mb-3">Quantity</p>
          <div className="inline-flex items-center gap-1 rounded-full bg-blush border border-rose/40 p-1">
            <button onClick={() => setQty(Math.max(1, qty - 1))} data-testid="qty-minus" className="w-9 h-9 rounded-full bg-white flex items-center justify-center text-pinkDeep">
              <Minus size={16} strokeWidth={3} />
            </button>
            <span data-testid="qty-value" className="min-w-[40px] text-center font-semibold text-pinkDeep">{qty}</span>
            <button onClick={() => setQty(qty + 1)} data-testid="qty-plus" className="w-9 h-9 rounded-full bg-white flex items-center justify-center text-pinkDeep">
              <Plus size={16} strokeWidth={3} />
            </button>
          </div>
        </div>

        {/* Delivery */}
        <div className="mt-6 grid grid-cols-3 gap-2">
          <div className="p-3 rounded-2xl bg-pinkSoft text-center">
            <Truck size={20} className="mx-auto text-pinkDeep" />
            <p className="mt-2 text-[11px] font-semibold text-foreground/80">12 min delivery</p>
          </div>
          <div className="p-3 rounded-2xl bg-pinkSoft text-center">
            <ShieldCheck size={20} className="mx-auto text-pinkDeep" />
            <p className="mt-2 text-[11px] font-semibold text-foreground/80">100% authentic</p>
          </div>
          <div className="p-3 rounded-2xl bg-pinkSoft text-center">
            <RotateCcw size={20} className="mx-auto text-pinkDeep" />
            <p className="mt-2 text-[11px] font-semibold text-foreground/80">Easy returns</p>
          </div>
        </div>

        {/* Accordions */}
        <div className="mt-6 divide-y divide-border/60 border-y border-border/60">
          <button onClick={() => setOpenAbout(!openAbout)} className="w-full flex items-center justify-between py-4 text-left">
            <span className="font-semibold">About this product</span>
            <ChevronDown size={18} className={`transition-transform ${openAbout ? "rotate-180" : ""}`} />
          </button>
          {openAbout && (
            <div className="pb-4 text-sm text-foreground/70 leading-relaxed">
              Carefully sourced and mom-approved. {product.name} from {product.brand} is designed to be gentle on your little one — free of harsh chemicals, dermatologically tested, and packed with love.
            </div>
          )}
          <button onClick={() => setOpenHighlights(!openHighlights)} className="w-full flex items-center justify-between py-4 text-left">
            <span className="font-semibold">Highlights</span>
            <ChevronDown size={18} className={`transition-transform ${openHighlights ? "rotate-180" : ""}`} />
          </button>
          {openHighlights && (
            <ul className="pb-4 text-sm text-foreground/70 space-y-1.5">
              <li>• Category: {category?.name}</li>
              <li>• Brand: {product.brand}</li>
              <li>• Pack size: {product.qty}</li>
              <li>• Country of origin: India</li>
              <li>• Manufactured for Mumzo Retail Pvt. Ltd.</li>
            </ul>
          )}
        </div>
      </div>

      {/* Sticky add-to-cart bar */}
      <div className="fixed md:absolute bottom-0 inset-x-0 z-40 mx-auto max-w-md bg-background/95 backdrop-blur-lg border-t border-border/60">
        <div className="flex items-center gap-3 px-5 py-4">
          <div className="leading-tight">
            <p className="font-semibold text-lg">{rupee(product.price * qty)}</p>
            {product.mrp > product.price && <p className="text-[11px] text-foreground/45 line-through -mt-0.5">{rupee(product.mrp * qty)}</p>}
          </div>
          <button
            onClick={handleAdd}
            data-testid="add-to-cart"
            className="flex-1 py-3.5 rounded-full bg-pinkDeep text-white text-sm font-semibold active:scale-[0.98] transition-transform"
          >
            Add to cart →
          </button>
        </div>
      </div>
    </div>
  );
}
