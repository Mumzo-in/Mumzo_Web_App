import { Link } from "@tanstack/react-router";

/**
 * NotFound — rendered by the router for any unmatched route
 * (wired as `defaultNotFoundComponent` in main.tsx).
 */
export function NotFound() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
      <span className="font-bold text-5xl text-muted-foreground">404</span>
      <h1 className="font-semibold text-2xl">Page not found</h1>
      <p className="max-w-sm text-muted-foreground text-sm">
        The page you're looking for doesn't exist or has moved.
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
