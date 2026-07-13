import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/core/components/coming-soon";

export const Route = createFileRoute("/search")({
  component: SearchPage,
});

function SearchPage() {
  return <ComingSoon title="Search" />;
}
