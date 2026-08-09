import { createFileRoute } from "@tanstack/react-router";
import { ServiceAreaTable } from "@/modules/service-area";

export const Route = createFileRoute("/(admin)/operations/service-areas")({
  component: RouteComponent,
});

function RouteComponent() {
  return <ServiceAreaTable />;
}
