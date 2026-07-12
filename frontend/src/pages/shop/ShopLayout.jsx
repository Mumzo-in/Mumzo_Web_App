import { Outlet, useLocation } from "react-router-dom";
import BottomNav from "./components/BottomNav";

export default function ShopLayout() {
  const location = useLocation();
  const hideNav =
    location.pathname.startsWith("/app/order/success") ||
    location.pathname.startsWith("/app/product/") ||
    location.pathname.startsWith("/app/cart");

  return (
    <div className="min-h-screen bg-gradient-to-br from-blush via-background to-pinkSoft">
      <div className="min-h-screen mx-auto max-w-md md:my-6 md:rounded-[36px] md:overflow-hidden md:shadow-[0_30px_80px_rgba(45,23,32,0.12)] md:border md:border-border/50 bg-background relative pb-24">
        <Outlet />
        {!hideNav && <BottomNav />}
      </div>
    </div>
  );
}
