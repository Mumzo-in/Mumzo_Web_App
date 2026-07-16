import type { ReactNode } from "react";
import AdminBreadcrumbs from "./admin-breadcrumbs";

type AdminHeaderProps = {
  /**
   * Rendered at the trailing edge — the auth module's UserMenu in practice.
   * Injected rather than imported so `core/` stays a leaf layer and never
   * depends on `modules/` (AGENTS.md §3).
   */
  actions?: ReactNode;
};

export function AdminHeader({ actions }: AdminHeaderProps) {
  return (
    <header
      className="flex h-14 shrink-0 items-center gap-3 border-b bg-background px-4 md:px-6"
      data-testid="admin-header"
    >
      <AdminBreadcrumbs />
      <div className="flex-1" />
      {actions}
    </header>
  );
}

export default AdminHeader;
