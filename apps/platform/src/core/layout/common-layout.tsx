import { useIsMobile } from "@mumzo/ui/hooks/use-mobile";
import { Outlet } from "@tanstack/react-router";
import BottomNav from "@/core/components/bottom-nav";
import Footer from "@/core/components/footer";
import Header from "@/core/components/header";

export default function CommonLayout() {
  const isMobile = useIsMobile();

  return (
    <div className={`flex min-h-screen flex-col ${isMobile ? "pb-16" : ""}`}>
      <Header />
      <main className="flex-grow">
        <Outlet />
      </main>
      {!isMobile && <Footer />}
      {isMobile && <BottomNav />}
    </div>
  );
}
