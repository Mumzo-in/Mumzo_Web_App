import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/(admin)/staff/audit-log")({
  beforeLoad: () => {
    throw redirect({ to: "/settings/activity-logs" });
  },
});
