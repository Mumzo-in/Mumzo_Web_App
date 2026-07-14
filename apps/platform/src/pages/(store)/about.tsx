import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/core/components/coming-soon";

export const Route = createFileRoute("/(store)/about")({
  component: AboutPage,
});

function AboutPage() {
  return <ComingSoon title="About" />;
}
