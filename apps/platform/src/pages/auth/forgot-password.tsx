import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/core/components/coming-soon";

export const Route = createFileRoute("/auth/forgot-password")({
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  return <ComingSoon title="Forgot password" />;
}
