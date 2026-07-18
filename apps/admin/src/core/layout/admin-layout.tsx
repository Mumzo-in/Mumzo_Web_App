import type { ReactNode } from "react";
import AdminHeader from "./admin-header";
import AdminSidebar from "./admin-sidebar";
import { NavPanelProvider } from "./use-nav-panel";

type AdminLayoutProps = {
  children: ReactNode;
  /** Trailing header slot — the auth module's UserMenu. */
  headerActions?: ReactNode;
};

/**
 * Three columns: nav rail │ section panel │ content.
 *
 * `min-w-0` on the content column matters — without it a wide table refuses to
 * shrink and pushes the whole page into horizontal scroll instead of scrolling
 * inside its own container.
 */
export function AdminLayout({ children, headerActions }: AdminLayoutProps) {
  return (
    <NavPanelProvider>
      <div className="flex h-svh overflow-hidden">
        <AdminSidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <AdminHeader actions={headerActions} />
          <main
            className="flex flex-1 flex-col gap-6 overflow-y-auto p-4 md:p-6"
            data-testid="admin-main"
          >
            {children}
          </main>
        </div>
      </div>
    </NavPanelProvider>
  );
}

export default AdminLayout;
