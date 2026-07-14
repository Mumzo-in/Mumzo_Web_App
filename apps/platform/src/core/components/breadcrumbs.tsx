import { cn } from "@mumzo/ui/lib/utils";
import { Link } from "@tanstack/react-router";
import React from "react";

export interface BreadcrumbItem {
  label: string;
  to?: string;
  params?: Record<string, string>;
  search?: Record<string, unknown>;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

export default function Breadcrumbs({ items, className }: BreadcrumbsProps) {
  return (
    <nav
      className={cn(
        "mb-6 flex flex-wrap items-center gap-1.5 text-foreground/55 text-xs",
        className,
      )}
    >
      {items.map((item, index) => {
        const isLast = index === items.length - 1;

        if (isLast || !item.to) {
          return (
            <span key={item.label} className="font-medium text-foreground">
              {item.label}
            </span>
          );
        }

        return (
          <React.Fragment key={item.label}>
            <Link
              to={item.to}
              params={item.params}
              search={item.search}
              className="transition-colors hover:text-primary"
            >
              {item.label}
            </Link>
            <span className="select-none text-foreground/30">·</span>
          </React.Fragment>
        );
      })}
    </nav>
  );
}
