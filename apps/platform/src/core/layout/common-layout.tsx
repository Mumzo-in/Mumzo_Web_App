import { useIsMobile } from "@mumzo/ui/hooks/use-mobile";
import { Outlet } from "@tanstack/react-router";
import BottomNav from "@/core/components/bottom-nav";
import Footer from "@/core/components/footer";
import Header from "@/core/components/header";

export default function CommonLayout() {
  const isMobile = useIsMobile();

  return (
    <div
      className={`flex min-h-screen flex-col ${isMobile ? "pb-[calc(4rem+env(safe-area-inset-bottom))]" : ""}`}
    >
      <Header />
      <main className="mx-auto w-full max-w-7xl flex-grow px-4 md:px-6 lg:px-8">
        <Outlet />
      </main>
      {!isMobile && <Footer />}
      {isMobile && <BottomNav />}
    </div>
  );
}
