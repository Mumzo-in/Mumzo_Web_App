import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/core/components/coming-soon";

export const Route = createFileRoute("/(store)/legal/returns")({
  component: ReturnsPage,
});

function ReturnsPage() {
  return <ComingSoon title="Return & Refund Policy" />;
}
