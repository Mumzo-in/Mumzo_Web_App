import type { ReactNode } from "react";

import Breadcrumbs, { type BreadcrumbItem } from "./breadcrumbs";

interface ContentPageProps {
  title: string;
  subtitle?: string;
  breadcrumbs: BreadcrumbItem[];
  updatedAt?: string;
  children: ReactNode;
}

/**
 * Shared editorial wrapper for static/legal/help pages — breadcrumbs, a
 * Fraunces title, optional subtitle, and a readable prose column.
 */
export default function ContentPage({
  title,
  subtitle,
  breadcrumbs,
  updatedAt,
  children,
}: ContentPageProps) {
  return (
    <div className="mx-auto max-w-[760px] px-4 pt-8 pb-20">
      <Breadcrumbs items={breadcrumbs} />
      <header className="mb-8">
        <h1 className="font-editorial text-4xl text-ink leading-none tracking-tight sm:text-5xl">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-3 text-base text-foreground/60 leading-relaxed">
            {subtitle}
          </p>
        )}
        {updatedAt && (
          <p className="mt-2 text-foreground/45 text-xs">
            Last updated {updatedAt}
          </p>
        )}
      </header>
      <div className="flex flex-col gap-8">{children}</div>
    </div>
  );
}

export function Section({
  heading,
  children,
}: {
  heading: string;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="font-editorial text-ink text-xl">{heading}</h2>
      <div className="flex flex-col gap-3 text-foreground/70 text-sm leading-relaxed">
        {children}
      </div>
    </section>
  );
}
