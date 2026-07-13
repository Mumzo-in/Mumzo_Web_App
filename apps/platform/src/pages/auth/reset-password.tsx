import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/core/components/coming-soon";

export const Route = createFileRoute("/auth/reset-password")({
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  return <ComingSoon title="Reset password" />;
}
