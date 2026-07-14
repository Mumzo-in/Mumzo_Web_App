import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import type { Offer, Product } from "@/core/data";

export interface CartItem {
  key: string;
  id: string;
  name: string;
  brand: string;
  price: number;
  mrp: number;
  img: string;
  qty: number;
  size: string | null;
  categorySlug: string;
}

export interface CartTotals {
  subtotal: number;
  mrpTotal: number;
  savings: number;
  discount: number;
  delivery: number;
  gst: number;
  total: number;
  count: number;
}

interface CartContextValue {
  items: CartItem[];
  addItem: (product: Product, size?: string | null, qty?: number) => void;
  removeItem: (key: string) => void;
  updateQty: (key: string, qty: number) => void;
  clear: () => void;
  coupon: Offer | null;
  setCoupon: (coupon: Offer | null) => void;
  totals: CartTotals;
}

const CartContext = createContext<CartContextValue | null>(null);

const STORAGE_KEY = "mumzo_cart_v1";
const FREE_DELIVERY_OVER = 299;
const DELIVERY_FEE = 25;
const GST_RATE = 0.05;

function readStoredItems(): CartItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as CartItem[]) : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(readStoredItems);
  const [coupon, setCoupon] = useState<Offer | null>(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const addItem = (product: Product, size: string | null = null, qty = 1) => {
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

  const removeItem = (key: string) =>
    setItems((prev) => prev.filter((i) => i.key !== key));

  const updateQty = (key: string, qty: number) => {
    if (qty <= 0) {
      removeItem(key);
      return;
    }
    setItems((prev) => prev.map((i) => (i.key === key ? { ...i, qty } : i)));
  };

  const clear = () => {
    setItems([]);
    setCoupon(null);
  };

  const totals = useMemo<CartTotals>(() => {
    const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
    const mrpTotal = items.reduce((s, i) => s + i.mrp * i.qty, 0);
    const savings = mrpTotal - subtotal;

    let discount = 0;
    if (coupon?.discount) {
      discount = subtotal >= (coupon.minAmt ?? 0) ? coupon.discount : 0;
    }
    if (coupon?.pct) {
      discount = Math.min(
        Math.floor(subtotal * (coupon.pct / 100)),
        coupon.cap ?? Number.POSITIVE_INFINITY,
      );
    }

    const delivery = subtotal >= FREE_DELIVERY_OVER ? 0 : DELIVERY_FEE;
    const gst = Math.round((subtotal - discount) * GST_RATE);
    const total = Math.max(0, subtotal - discount + delivery + gst);
    const count = items.reduce((s, i) => s + i.qty, 0);

    return {
      subtotal,
      mrpTotal,
      savings,
      discount,
      delivery,
      gst,
      total,
      count,
    };
  }, [items, coupon]);

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      addItem,
      removeItem,
      updateQty,
      clear,
      coupon,
      setCoupon,
      totals,
    }),
    [items, coupon, totals, updateQty, clear, removeItem, addItem],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error("useCart must be used inside <CartProvider>");
  }
  return ctx;
}

export const rupee = (n: number): string =>
  `₹${Math.round(n).toLocaleString("en-IN")}`;
