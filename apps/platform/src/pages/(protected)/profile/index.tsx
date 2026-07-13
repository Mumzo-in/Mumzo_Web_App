import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/core/components/coming-soon";

export const Route = createFileRoute("/(protected)/profile/")({
  component: ProfilePage,
});

function ProfilePage() {
  return <ComingSoon title="Profile" />;
}
