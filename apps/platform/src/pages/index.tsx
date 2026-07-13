import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/core/components/coming-soon";

export const Route = createFileRoute("/")({
  component: HomePage,
});

function HomePage() {
  return <ComingSoon title="Home" />;
}
