import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/core/components/coming-soon";

export const Route = createFileRoute("/legal/terms")({
  component: TermsPage,
});

function TermsPage() {
  return <ComingSoon title="Terms & Conditions" />;
}
