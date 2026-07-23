import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { resolveRole } from "@/core/auth/roles";
import AdminLayout from "@/core/layout/admin-layout";
import { sessionQueryOptions, UserMenu } from "@/modules/auth";

/**
 * The role gate. Every admin route nests under this pathless group, so this
 * `beforeLoad` is the single chokepoint into the panel.
 *
 * Two checks, in order:
 *   1. No session                 → /login
 *   2. Session, but no admin role → /forbidden
 *
 * Step 2 is defence in depth rather than the primary guard. `authClient` talks
 * to the staff Better Auth instance, which reads its own cookie backed by
 * `staff_user` — a storefront customer's session simply does not resolve here.
 * The role check catches the narrower case of a staff account whose role was
 * revoked or set to something unrecognised.
 *
 * This runs in the browser, so it controls *rendering*, not access. The server
 * enforces the real boundary via `requireStaffAuth`; never rely on this alone
 * to protect data.
 */
export const Route = createFileRoute("/(admin)")({
  component: AdminGroupLayout,
  beforeLoad: async ({ context, location }) => {
    const session =
      await context.queryClient.ensureQueryData(sessionQueryOptions);

    const hasValidSession = Boolean(session?.user && session?.session);

    if (!hasValidSession) {
      throw redirect({
        to: "/auth/login",
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
    <AdminLayout sidebarFooter={<UserMenu side="right" align="end" />}>
      <Outlet />
    </AdminLayout>
  );
}
