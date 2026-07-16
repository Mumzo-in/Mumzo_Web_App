import { ScrollArea } from "@mumzo/ui/components/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@mumzo/ui/components/tooltip";
import { cn } from "@mumzo/ui/lib/utils";
import { Link, useRouterState } from "@tanstack/react-router";
import { PanelLeftClose } from "lucide-react";
import { useEffect, useState } from "react";
import NavChip from "./nav-chip";
import { NAV_SECTIONS, type NavSection, sectionForPath } from "./nav-data";

/**
 * Two-panel navigation.
 *
 *   rail (icons) │ panel (flat link list) │ content
 *
 * The rail selects a section; it does not navigate. The panel lists every page
 * in that section as a flat list — no accordions, so once a section is picked
 * every page under it is a single click.
 *
 * The panel is closable. When closed the rail stays, and clicking a rail icon
 * reopens the panel on that section — so the nav is never a dead end.
 */

const PANEL_STORAGE_KEY = "mumzo-admin-nav-panel";

function isPathActive(pathname: string, to: string): boolean {
  if (to === "/") {
    return pathname === "/";
  }
  return pathname === to || pathname.startsWith(`${to}/`);
}

function readPanelOpen(): boolean {
  if (typeof window === "undefined") {
    return true;
  }
  return window.localStorage.getItem(PANEL_STORAGE_KEY) !== "closed";
}

export function AdminSidebar({
  sections = NAV_SECTIONS,
}: {
  sections?: NavSection[];
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  // The rail is browsable — clicking an icon previews a section without
  // navigating — so selection is local state, seeded from the current route.
  const [selectedId, setSelectedId] = useState<string | null>(
    () => sectionForPath(pathname) ?? sections[0]?.id ?? null,
  );
  const [panelOpen, setPanelOpen] = useState(readPanelOpen);

  // Navigating (via a link, or back/forward) re-syncs the rail to the page you
  // actually landed on, so the panel never contradicts the content area.
  useEffect(() => {
    const owner = sectionForPath(pathname);
    if (owner) {
      setSelectedId(owner);
    }
  }, [pathname]);

  useEffect(() => {
    window.localStorage.setItem(
      PANEL_STORAGE_KEY,
      panelOpen ? "open" : "closed",
    );
  }, [panelOpen]);

  const active = sections.find((s) => s.id === selectedId) ?? sections[0];

  function handleRailClick(sectionId: string) {
    // Re-clicking the open section collapses it; any other opens that section.
    if (panelOpen && sectionId === active?.id) {
      setPanelOpen(false);
      return;
    }
    setSelectedId(sectionId);
    setPanelOpen(true);
  }

  return (
    <div className="flex shrink-0" data-testid="admin-sidebar">
      {/* Rail */}
      <nav
        aria-label="Sections"
        className="flex w-[72px] shrink-0 flex-col items-center gap-1 border-sidebar-border border-r bg-sidebar py-3"
        data-testid="admin-nav-rail"
      >
        <Link
          to="/"
          className="mb-2 flex size-9 items-center justify-center rounded-full bg-sidebar-primary font-editorial text-base text-sidebar-primary-foreground transition-opacity hover:opacity-85"
          data-testid="admin-sidebar-brand"
          aria-label="Mumzo admin home"
        >
          m
        </Link>

        {sections.map((section) => {
          const selected = panelOpen && section.id === active?.id;
          return (
            <Tooltip key={section.id}>
              <TooltipTrigger
                render={
                  <button
                    type="button"
                    onClick={() => handleRailClick(section.id)}
                    aria-current={selected ? "true" : undefined}
                    aria-expanded={selected}
                    data-testid={`admin-rail-${section.id}`}
                    className={cn(
                      "flex w-[60px] flex-col items-center gap-1 rounded-xl px-1 py-2 transition-colors",
                      selected
                        ? "bg-sidebar-accent text-sidebar-accent-foreground"
                        : "text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
                    )}
                  />
                }
              >
                <section.icon className="size-[18px]" />
                <span className="w-full truncate text-[9px] leading-tight tracking-wide">
                  {section.label}
                </span>
              </TooltipTrigger>
              <TooltipContent side="right">{section.label}</TooltipContent>
            </Tooltip>
          );
        })}
      </nav>

      {/* Secondary panel — width animates to 0 so the content area reflows. */}
      <div
        className={cn(
          "flex shrink-0 flex-col overflow-hidden border-sidebar-border bg-sidebar transition-[width] duration-200 ease-out",
          panelOpen ? "w-[200px] border-r" : "w-0",
        )}
        data-testid="admin-nav-panel"
        data-state={panelOpen ? "open" : "closed"}
        // Hidden from AT and tab order when closed — a 0-width panel is still
        // focusable otherwise, which strands keyboard users in invisible links.
        inert={panelOpen ? undefined : true}
        aria-hidden={panelOpen ? undefined : true}
      >
        <div className="flex w-[200px] items-center justify-between gap-2 py-4 pr-2 pl-4">
          <h2 className="truncate font-editorial text-lg text-sidebar-foreground leading-none tracking-tighter">
            {active?.label}
          </h2>
          <button
            type="button"
            onClick={() => setPanelOpen(false)}
            aria-label="Close section panel"
            data-testid="admin-nav-panel-close"
            className="flex size-7 shrink-0 items-center justify-center rounded-lg text-sidebar-foreground/60 transition-colors hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
          >
            <PanelLeftClose className="size-4" />
          </button>
        </div>

        <ScrollArea className="w-[200px] flex-1">
          <div className="flex flex-col gap-4 px-2 pb-4">
            {active?.groups.map((group) => (
              <div key={group.label} className="flex flex-col gap-0.5">
                <span className="px-2 py-1 text-[10px] text-sidebar-foreground/50 uppercase tracking-[0.14em]">
                  {group.label}
                </span>
                {group.items.map((item) => {
                  const current = isPathActive(pathname, item.to);
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      aria-current={current ? "page" : undefined}
                      data-testid={`admin-nav-${item.to}`}
                      className={cn(
                        "flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors",
                        current
                          ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                          : "text-sidebar-foreground/75 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
                      )}
                    >
                      <span className="flex-1 truncate">{item.label}</span>
                      {item.comingSoon ? <NavChip>Soon</NavChip> : null}
                    </Link>
                  );
                })}
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}

export default AdminSidebar;
