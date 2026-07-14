import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/(store)/(protected)")({
  component: ProtectedLayout,
  // beforeLoad: async () => {
  //   const session = await authClient.getSession();
  //   if (!session.data) {
  //     throw redirect({
  //       to: "/auth/login",
  //     });
  //   }
  //   return { session };
  // },
});

function ProtectedLayout() {
  return <Outlet />;
}
