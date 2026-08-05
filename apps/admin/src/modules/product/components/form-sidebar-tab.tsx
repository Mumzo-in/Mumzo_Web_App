import { cn } from "@mumzo/ui/lib/utils";
import type { ComponentType } from "react";

export function FormSidebarTab({
  label,
  description,
  icon: Icon,
  isActive,
  isComplete,
  hasErrors,
  onClick,
  testId,
}: {
  label: string;
  description?: string;
  icon: ComponentType<{ className?: string }>;
  isActive: boolean;
  isComplete: boolean;
  hasErrors: boolean;
  onClick: () => void;
  testId?: string;
}) {
  return (
    <button
      className={cn(
        "flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left transition-colors",
        isActive
          ? "bg-secondary font-semibold text-secondary-foreground"
          : "text-muted-foreground hover:bg-secondary/40 hover:text-foreground",
      )}
      data-testid={testId}
      onClick={onClick}
      type="button"
    >
      <div className="flex items-center gap-3">
        <Icon
          className={cn(
            "size-4 shrink-0",
            isActive ? "text-primary" : "text-muted-foreground",
          )}
        />
        <div className="flex flex-col gap-0.5">
          <span className="text-sm leading-none">{label}</span>
          {description ? (
            <span className="text-[10px] opacity-70">{description}</span>
          ) : null}
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        {hasErrors ? (
          <span
            aria-label="Errors present"
            className="size-2 animate-pulse rounded-full bg-destructive"
            role="img"
          />
        ) : null}
        {isComplete && !hasErrors ? (
          <span className="font-bold text-primary text-xs">✓</span>
        ) : null}
      </div>
    </button>
  );
}

export default FormSidebarTab;
