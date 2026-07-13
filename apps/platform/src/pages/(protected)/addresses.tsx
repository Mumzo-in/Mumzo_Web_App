import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/core/components/coming-soon";

export const Route = createFileRoute("/(protected)/addresses")({
  component: AddressesPage,
});

function AddressesPage() {
  return <ComingSoon title="Addresses" />;
}
