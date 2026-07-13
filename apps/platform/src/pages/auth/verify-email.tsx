import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/core/components/coming-soon";

export const Route = createFileRoute("/auth/verify-email")({
  component: VerifyEmailPage,
});

function VerifyEmailPage() {
  return <ComingSoon title="Verify email" />;
}
