import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/core/components/coming-soon";

export const Route = createFileRoute("/(store)/help")({
  component: HelpPage,
});

function HelpPage() {
  return <ComingSoon title="Help & Support" />;
}
