import { Link } from "@tanstack/react-router";

/**
 * ComingSoon — shared placeholder shown on pages that are scaffolded
 * but not built yet. Pass the page name via `title`.
 */
export function ComingSoon({ title }: { title: string }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
      <span className="font-semibold text-muted-foreground text-xs uppercase tracking-widest">
        {title}
      </span>
      <h1 className="font-semibold text-2xl">Coming soon</h1>
      <p className="max-w-sm text-muted-foreground text-sm">
        This page is a placeholder — we're still building it.
      </p>
      <Link
        to="/"
        className="font-medium text-primary text-sm underline-offset-4 hover:underline"
      >
        Back to home
      </Link>
    </div>
  );
}
