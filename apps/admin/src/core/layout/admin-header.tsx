import { Separator } from "@mumzo/ui/components/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@mumzo/ui/components/tooltip";
import { PanelLeft } from "lucide-react";
import type { ReactNode } from "react";
import AdminBreadcrumbs from "./admin-breadcrumbs";
import { useNavPanel } from "./use-nav-panel";

type AdminHeaderProps = {
  /**
   * Rendered at the trailing edge — the auth module's UserMenu in practice.
   * Injected rather than imported so `core/` stays a leaf layer and never
   * depends on `modules/` (AGENTS.md §3).
   */
  actions?: ReactNode;
};

export function AdminHeader({ actions }: AdminHeaderProps) {
  const { open, toggle } = useNavPanel();

  return (
    <header
      className="flex h-14 shrink-0 items-center gap-3 border-b bg-background px-4 md:px-6"
      data-testid="admin-header"
    >
      <Tooltip>
        <TooltipTrigger
          render={
            <button
              type="button"
              onClick={toggle}
              aria-expanded={open}
              aria-label={open ? "Hide section panel" : "Show section panel"}
              data-testid="admin-nav-panel-toggle"
              className="-ml-1 flex size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            />
          }
        >
          <PanelLeft className="size-4" />
        </TooltipTrigger>
        <TooltipContent side="bottom">
          {open ? "Hide section panel" : "Show section panel"}
        </TooltipContent>
      </Tooltip>

      <Separator orientation="vertical" className="h-4" />

      <AdminBreadcrumbs />
      <div className="flex-1" />
      {actions}
    </header>
  );
}

export default AdminHeader;
