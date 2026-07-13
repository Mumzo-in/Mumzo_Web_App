import { createFileRoute } from "@tanstack/react-router";
import { ComingSoon } from "@/core/components/coming-soon";

export const Route = createFileRoute("/(protected)/notifications")({
  component: NotificationsPage,
});

function NotificationsPage() {
  return <ComingSoon title="Notifications" />;
}
