import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/core/components/coming-soon";

export const Route = createFileRoute("/(store)/legal/privacy")({
  component: PrivacyPage,
});

function PrivacyPage() {
  return <ComingSoon title="Privacy Policy" />;
}
