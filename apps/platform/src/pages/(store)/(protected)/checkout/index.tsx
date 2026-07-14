import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/(store)/(protected)/checkout/")({
  component: () => Navigate({ to: "/checkout/address" }),
});
