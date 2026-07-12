import { createContext, useContext, useState, useMemo, useEffect } from "react";

const CartContext = createContext(null);

const STORAGE_KEY = "mumzo_cart_v1";

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const [coupon, setCoupon] = useState(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const addItem = (product, size = null, qty = 1) => {
    setItems((prev) => {
      const key = size ? `${product.id}::${size}` : product.id;
      const idx = prev.findIndex((i) => i.key === key);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], qty: next[idx].qty + qty };
        return next;
      }
      return [
        ...prev,
        {
          key,
          id: product.id,
          name: product.name,
          brand: product.brand,
          price: product.price,
          mrp: product.mrp,
          img: product.img,
          qty,
          size,
          categorySlug: product.categorySlug,
        },
      ];
    });
  };

  const removeItem = (key) =>
    setItems((prev) => prev.filter((i) => i.key !== key));

  const updateQty = (key, qty) => {
    if (qty <= 0) return removeItem(key);
    setItems((prev) => prev.map((i) => (i.key === key ? { ...i, qty } : i)));
  };

  const clear = () => {
    setItems([]);
    setCoupon(null);
  };

  const totals = useMemo(() => {
    const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
    const mrpTotal = items.reduce((s, i) => s + i.mrp * i.qty, 0);
    const savings = mrpTotal - subtotal;

    let discount = 0;
    if (coupon) {
      if (coupon.discount) discount = subtotal >= (coupon.minAmt || 0) ? coupon.discount : 0;
      if (coupon.pct) discount = Math.min(Math.floor(subtotal * (coupon.pct / 100)), coupon.cap || Infinity);
    }

    const delivery = subtotal >= 299 ? 0 : 25;
    const gst = Math.round((subtotal - discount) * 0.05);
    const total = Math.max(0, subtotal - discount + delivery + gst);
    const count = items.reduce((s, i) => s + i.qty, 0);
    return { subtotal, mrpTotal, savings, discount, delivery, gst, total, count };
  }, [items, coupon]);

  return (
    <CartContext.Provider
      value={{ items, addItem, removeItem, updateQty, clear, coupon, setCoupon, totals }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be inside CartProvider");
  return ctx;
};

export const rupee = (n) => `₹${Math.round(n).toLocaleString("en-IN")}`;
