import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Heart, Share2, Star, Truck, ShieldCheck, RotateCcw, Minus, Plus } from "lucide-react";
import { findProduct, findCategory, productsInCategory } from "../shop/data";
import { useCart, rupee } from "../shop/CartContext";
import WebProductCard from "./WebProductCard";

const AllSizes = ["XS", "S", "M", "L", "XL", "XXL", "0-3M", "3-6M", "6-9M", "1-2Y"];

export default function WebProduct() {
  const { id } = useParams();
  const nav = useNavigate();
  const product = findProduct(id);
  const category = product ? findCategory(product.categorySlug) : null;
  const related = product ? productsInCategory(product.categorySlug).filter(p => p.id !== product.id).slice(0, 4) : [];
  const { addItem } = useCart();

  const [size, setSize] = useState(product?.sizes || null);
  const [qty, setQty] = useState(1);
  const [saved, setSaved] = useState(false);

  if (!product) return <div className="max-w-[1280px] mx-auto px-6 py-16 text-center">Product not found.</div>;

  const availableSizes = AllSizes.slice(0, product.categorySlug === "clothing" ? 5 : 4);
  const needsSize = ["clothing", "diapers", "nursery"].includes(product.categorySlug);

  const handleAdd = () => {
    addItem(product, size, qty);
    nav("/web/cart");
  };

  return (
    <div data-testid="web-product-page" className="max-w-[1280px] mx-auto px-6 lg:px-8 pt-8 pb-12">
      {/* Breadcrumb */}
      <nav className="text-xs text-foreground/55 mb-6">
        <Link to="/web" className="hover:text-pinkDeep">Home</Link> <span className="mx-1.5">·</span>
        <Link to={`/web/category/${product.categorySlug}`} className="hover:text-pinkDeep">{category?.name}</Link> <span className="mx-1.5">·</span>
        <span className="text-foreground">{product.name}</span>
      </nav>

      {/* Main split */}
      <div className="grid lg:grid-cols-[1fr_1fr] gap-10 lg:gap-16">
        {/* Left: images */}
        <div>
          <div className="relative aspect-square rounded-3xl bg-blush/40 overflow-hidden border border-border/50">
            <img src={product.img} alt={product.name} className="w-full h-full object-cover" />
            {product.discount > 0 && (
              <span className="absolute top-4 left-4 px-3 py-1 rounded-full bg-pinkDeep text-white text-xs font-bold">
                {product.discount}% OFF
              </span>
            )}
            <div className="absolute top-4 right-4 flex gap-2">
              <button onClick={() => setSaved(!saved)} data-testid="web-wishlist" className="w-10 h-10 rounded-full bg-white/95 border border-border/60 flex items-center justify-center hover:border-pinkDeep">
                <Heart size={16} fill={saved ? "#C85277" : "none"} color={saved ? "#C85277" : "currentColor"} />
              </button>
              <button className="w-10 h-10 rounded-full bg-white/95 border border-border/60 flex items-center justify-center hover:border-pinkDeep">
                <Share2 size={16} />
              </button>
            </div>
          </div>
          {/* Thumbnails (stylised) */}
          <div className="mt-4 grid grid-cols-4 gap-3">
            {[0, 1, 2, 3].map(i => (
              <button key={i} className={`aspect-square rounded-2xl overflow-hidden border ${i === 0 ? "border-pinkDeep ring-2 ring-pinkDeep/20" : "border-border/50 opacity-70 hover:opacity-100"}`}>
                <img src={product.img} className="w-full h-full object-cover" alt="" />
              </button>
            ))}
          </div>
        </div>

        {/* Right: info */}
        <div>
          <p className="text-xs uppercase tracking-widest text-pinkDeep font-semibold">{product.brand}</p>
          <h1 className="mt-2 font-editorial text-4xl lg:text-5xl leading-[1.05]">{product.name}</h1>
          <p className="mt-2 text-sm text-foreground/60">{product.qty}</p>

          <div className="mt-4 flex items-center gap-2">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blush">
              <Star size={12} fill="#C85277" strokeWidth={0} />
              <span className="text-xs font-semibold text-pinkDeep">{product.rating}</span>
            </div>
            <span className="text-xs text-foreground/50">2.3k reviews</span>
            {product.bestseller && <span className="text-xs text-pinkDeep font-semibold">· Bestseller</span>}
          </div>

          <div className="mt-6 flex items-end gap-3">
            <span className="font-editorial text-4xl">{rupee(product.price)}</span>
            {product.mrp > product.price && (
              <>
                <span className="text-base text-foreground/45 line-through mb-1.5">{rupee(product.mrp)}</span>
                <span className="text-base text-pinkDeep font-semibold mb-1.5">Save {rupee(product.mrp - product.price)}</span>
              </>
            )}
          </div>
          <p className="text-xs text-foreground/55 mt-1">Inclusive of all taxes · Free delivery over ₹299</p>

          {needsSize && (
            <div className="mt-8">
              <p className="text-xs font-semibold uppercase tracking-widest text-foreground/60 mb-3">Choose size</p>
              <div className="flex gap-2 flex-wrap">
                {availableSizes.map(s => (
                  <button
                    key={s}
                    onClick={() => setSize(s)}
                    data-testid={`web-size-${s}`}
                    className={`min-w-[56px] px-4 py-2.5 rounded-full text-sm font-medium border ${
                      size === s ? "bg-pinkDeep text-white border-pinkDeep" : "bg-white text-foreground border-border/70 hover:border-pinkDeep"
                    }`}
                  >{s}</button>
                ))}
              </div>
            </div>
          )}

          <div className="mt-8 flex items-end gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-foreground/60 mb-3">Quantity</p>
              <div className="inline-flex items-center gap-1 rounded-full bg-blush border border-rose/40 p-1">
                <button onClick={() => setQty(Math.max(1, qty - 1))} data-testid="web-qty-minus" className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-pinkDeep">
                  <Minus size={16} strokeWidth={3} />
                </button>
                <span data-testid="web-qty-value" className="min-w-[48px] text-center font-semibold text-pinkDeep">{qty}</span>
                <button onClick={() => setQty(qty + 1)} data-testid="web-qty-plus" className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-pinkDeep">
                  <Plus size={16} strokeWidth={3} />
                </button>
              </div>
            </div>
            <button
              onClick={handleAdd}
              data-testid="web-add-to-cart"
              className="flex-1 py-4 rounded-full bg-pinkDeep text-white text-sm font-semibold hover:bg-[#A93F63] active:scale-[0.99] transition-all"
            >
              Add to cart · {rupee(product.price * qty)}
            </button>
          </div>

          {/* Trust row */}
          <div className="mt-8 grid grid-cols-3 gap-3">
            {[
              { Ic: Truck, k: "12-min delivery", v: "To your door" },
              { Ic: ShieldCheck, k: "Authentic", v: "Every product" },
              { Ic: RotateCcw, k: "Easy returns", v: "Within 7 days" },
            ].map(({ Ic, k, v }) => (
              <div key={k} className="p-3 rounded-2xl bg-pinkSoft border border-border/50">
                <Ic size={18} className="text-pinkDeep" />
                <p className="mt-2 text-xs font-semibold">{k}</p>
                <p className="text-[11px] text-foreground/60">{v}</p>
              </div>
            ))}
          </div>

          {/* About */}
          <div className="mt-10 pt-6 border-t border-border/60">
            <p className="text-xs font-semibold uppercase tracking-widest text-foreground/55">About this product</p>
            <p className="mt-3 text-sm text-foreground/75 leading-relaxed">
              Carefully sourced and mom-approved. {product.name} from {product.brand} is designed to be gentle on your little one — free of harsh chemicals, dermatologically tested, and packed with love. Every product is inspected before it leaves the micro-store.
            </p>
            <ul className="mt-4 text-sm text-foreground/75 space-y-1.5">
              <li>• Category: {category?.name}</li>
              <li>• Brand: {product.brand}</li>
              <li>• Pack size: {product.qty}</li>
              <li>• Country of origin: India</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Related */}
      {related.length > 0 && (
        <section className="mt-16">
          <h2 className="font-editorial text-2xl lg:text-3xl mb-6">You may also like</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {related.map(p => <WebProductCard key={p.id} product={p} />)}
          </div>
        </section>
      )}
    </div>
  );
}
