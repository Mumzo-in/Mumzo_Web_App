import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

import { authClient } from "@/modules/auth";

export const Route = createFileRoute("/(store)/(protected)")({
  component: ProtectedLayout,
  beforeLoad: async () => {
    const session = await authClient.getSession();
    if (!session.data) {
      throw redirect({
        to: "/auth/login",
      });
    }
    return { session };
  },
});

function ProtectedLayout() {
  return <Outlet />;
}
