import { createFileRoute, Outlet } from "@tanstack/react-router";

/**
 * Public, unauthenticated routes — no session gate, no `AdminLayout`.
 *
 * The delivery link lives here: riders are not staff users, open it on a phone
 * from WhatsApp, and have nothing to navigate to. So this group deliberately
 * skips the sidebar/header chrome and renders a single narrow column instead.
 */
export const Route = createFileRoute("/(public)")({
  component: PublicGroupLayout,
});

function PublicGroupLayout() {
  return (
    <div className="min-h-svh bg-background">
      <div className="mx-auto flex w-full max-w-md flex-col gap-4 px-4 py-6">
        <Outlet />
      </div>
    </div>
  );
}
