import { cn } from "@mumzo/ui/lib/utils";

/**
 * "Soon" chip for unbuilt routes.
 *
 * Not `<Badge variant="outline">`: that resolves to `text-foreground`, which is
 * navy — the same colour as the sidebar surface, so it renders invisible. The
 * sidebar is its own surface and must use `sidebar-*` tokens.
 */
export function NavChip({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "ml-auto shrink-0 rounded-full border border-sidebar-border/60 px-1.5 py-0.5 font-medium text-[10px] text-sidebar-foreground/55 leading-none",
        className,
      )}
      data-testid="admin-nav-chip"
    >
      {children}
    </span>
  );
}

export default NavChip;
