import type { ReactNode } from "react";

interface SectionHeaderProps {
  kicker: string;
  title: string;
  action?: ReactNode;
}

/** Shared editorial section header — kicker + Fraunces title + optional action. */
export default function SectionHeader({
  kicker,
  title,
  action,
}: SectionHeaderProps) {
  return (
    <div className="mb-5 flex items-end justify-between gap-4">
      <div>
        <span className="font-semibold text-[11px] text-primary uppercase tracking-widest">
          {kicker}
        </span>
        <h2 className="mt-1 font-editorial text-2xl leading-tight lg:text-3xl">
          {title}
        </h2>
      </div>
      {action}
    </div>
  );
}
