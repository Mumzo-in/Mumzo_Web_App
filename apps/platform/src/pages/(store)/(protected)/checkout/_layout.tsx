import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/(store)/(protected)/checkout")({
  component: CheckoutLayout,
});

export function CheckoutLayout() {
  return (
    <div className="mx-auto max-w-7xl px-4 pt-4 pb-24 sm:px-6 sm:pt-6 lg:px-8 lg:pb-16">
      <Outlet />
    </div>
  );
}
