import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/core/components/coming-soon";

export const Route = createFileRoute("/(store)/contact")({
  component: ContactPage,
});

function ContactPage() {
  return <ComingSoon title="Contact" />;
}
