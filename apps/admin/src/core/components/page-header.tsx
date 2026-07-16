import type { ReactNode } from "react";

type PageHeaderProps = {
  title: string;
  description?: string;
  /** Trailing actions — primary CTA, filters, exports. */
  actions?: ReactNode;
};

/** Consistent page title block for every admin screen. */
export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <div
      className="flex flex-wrap items-start justify-between gap-4"
      data-testid="admin-page-header"
    >
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl tracking-tighter">{title}</h1>
        {description ? (
          <p className="text-muted-foreground text-sm">{description}</p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex items-center gap-2">{actions}</div>
      ) : null}
    </div>
  );
}

export default PageHeader;
