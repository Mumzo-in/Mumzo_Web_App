import { createFileRoute, Outlet } from "@tanstack/react-router";

import { CheckoutProvider } from "@/modules/checkout";

export const Route = createFileRoute("/(store)/(protected)/checkout")({
  component: CheckoutLayout,
});

function CheckoutLayout() {
  return (
    <CheckoutProvider>
      <div className="mx-auto max-w-[1280px] pt-8 pb-16">
        <Outlet />
      </div>
    </CheckoutProvider>
  );
}
