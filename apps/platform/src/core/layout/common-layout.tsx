import { Outlet } from "@tanstack/react-router";
import Footer from "@/core/components/footer";
import Header from "@/core/components/header";

export default function CommonLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-grow">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
