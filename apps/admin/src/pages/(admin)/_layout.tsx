import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { bypassAuthGate, resolveRole } from "@/core/auth/roles";
import AdminLayout from "@/core/layout/admin-layout";
import { authClient, UserMenu } from "@/modules/auth";

/**
 * The role gate. Every admin route nests under this pathless group, so this
 * `beforeLoad` is the single chokepoint into the panel.
 *
 * Two checks, in order:
 *   1. No session                 → /login
 *   2. Session, but no admin role → /forbidden
 *
 * Step 2 matters: without it any customer who signs up on the storefront could
 * reach the panel, since both apps share one Better Auth instance.
 *
 * NOTE: `bypassAuthGate()` is currently on, so both checks are skipped in dev
 * while the screens are being built. It is forced off in production builds.
 */
export const Route = createFileRoute("/(admin)")({
  component: AdminGroupLayout,
  beforeLoad: async ({ location }) => {
    if (bypassAuthGate()) {
      return { session: null, role: null };
    }

    const { data: session } = await authClient.getSession();

    if (!session) {
      throw redirect({
        to: "/login",
        search: { redirect: location.href },
      });
    }

    const role = resolveRole(session.user);
    if (!role) {
      throw redirect({ to: "/forbidden" });
    }

    return { session, role };
  },
});

function AdminGroupLayout() {
  return (
    <AdminLayout headerActions={<UserMenu />}>
      <Outlet />
    </AdminLayout>
  );
}
