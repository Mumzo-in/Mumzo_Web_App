import { useEffect } from "react";
import Lenis from "lenis";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { Toaster } from "sonner";
import Landing from "@/pages/Landing";
import BrandBook from "@/pages/BrandBook";
import { CartProvider } from "@/pages/shop/CartContext";
import ShopLayout from "@/pages/shop/ShopLayout";
import ShopHome from "@/pages/shop/Home";
import ShopCategory from "@/pages/shop/Category";
import ShopProduct from "@/pages/shop/Product";
import ShopCart from "@/pages/shop/Cart";
import ShopOrderSuccess from "@/pages/shop/OrderSuccess";
import ShopProfile from "@/pages/shop/Profile";
import WebLayout from "@/pages/web/WebLayout";
import WebHome from "@/pages/web/Home";
import WebCategory from "@/pages/web/Category";
import WebProduct from "@/pages/web/Product";
import WebCart from "@/pages/web/Cart";
import WebOrderSuccess from "@/pages/web/OrderSuccess";
import "@/App.css";

function LenisSmoothScroll() {
  // Lenis is beautiful on the marketing landing, but its momentum interferes
  // with the app-shell scrolling and bottom-sheet drawers. Enable only on "/".
  const { pathname } = useLocation();
  useEffect(() => {
    if (pathname !== "/") return;
    const lenis = new Lenis({
      duration: 1.35,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      wheelMultiplier: 1.0,
      touchMultiplier: 1.4,
    });
    let rafId;
    const raf = (time) => { lenis.raf(time); rafId = requestAnimationFrame(raf); };
    rafId = requestAnimationFrame(raf);
    return () => { cancelAnimationFrame(rafId); lenis.destroy(); };
  }, [pathname]);
  return null;
}

function App() {
  return (
    <div className="App min-h-screen bg-background text-foreground">
      <BrowserRouter>
        <LenisSmoothScroll />
        <CartProvider>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/brand" element={<BrandBook />} />
            <Route path="/app" element={<ShopLayout />}>
              <Route index element={<ShopHome />} />
              <Route path="category/:slug" element={<ShopCategory />} />
              <Route path="product/:id" element={<ShopProduct />} />
              <Route path="cart" element={<ShopCart />} />
              <Route path="order/success" element={<ShopOrderSuccess />} />
              <Route path="profile" element={<ShopProfile />} />
            </Route>
            <Route path="/web" element={<WebLayout />}>
              <Route index element={<WebHome />} />
              <Route path="category/:slug" element={<WebCategory />} />
              <Route path="product/:id" element={<WebProduct />} />
              <Route path="cart" element={<WebCart />} />
              <Route path="order/success" element={<WebOrderSuccess />} />
            </Route>
          </Routes>
        </CartProvider>
      </BrowserRouter>
      <Toaster
        position="bottom-center"
        toastOptions={{
          style: {
            background: "#2D1720",
            color: "#FEF8F5",
            border: "1px solid #2D1720",
            borderRadius: "999px",
            fontFamily: "Manrope, sans-serif",
          },
        }}
      />
    </div>
  );
}

export default App;
