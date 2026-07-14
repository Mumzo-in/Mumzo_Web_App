import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/core/components/coming-soon";

export const Route = createFileRoute("/(store)/(protected)/profile/baby")({
  component: BabyProfilePage,
});

function BabyProfilePage() {
  return <ComingSoon title="Baby profile" />;
}
