import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/core/components/coming-soon";

export const Route = createFileRoute("/about")({
  component: AboutPage,
});

function AboutPage() {
  return <ComingSoon title="About" />;
}
