import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/(store)/(protected)/checkout")({
  component: CheckoutLayout,
});

function CheckoutLayout() {
  return (
    <div className="mx-auto max-w-[1280px] pt-8 pb-16">
      <Outlet />
    </div>
  );
}
