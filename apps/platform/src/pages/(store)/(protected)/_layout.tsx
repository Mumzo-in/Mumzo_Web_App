import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { sessionQueryOptions } from "@/modules/auth";

export const Route = createFileRoute("/(store)/(protected)")({
  component: ProtectedLayout,
  beforeLoad: async ({ context, location }) => {
    const session =
      await context.queryClient.ensureQueryData(sessionQueryOptions);
    if (!session) {
      throw redirect({
        to: "/auth/login",
        search: { redirect: location.href },
      });
    }
    return { session };
  },
});

function ProtectedLayout() {
  return <Outlet />;
}
