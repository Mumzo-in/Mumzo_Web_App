import { TriangleAlert } from "lucide-react";

/**
 * Inline banner for a section whose data is still mock/derived client-side
 * because the real endpoint doesn't exist yet. Names the missing piece so
 * it reads as an honest gap, not a bug.
 */
export function NeedsBackendNotice({ children }: { children: string }) {
  return (
    <div
      className="flex items-start gap-2 rounded-none border border-status-warning/20 bg-status-warning/10 px-3 py-2 text-status-warning text-xs"
      data-testid="admin-needs-backend-notice"
    >
      <TriangleAlert className="mt-0.5 size-3.5 shrink-0" />
      <span>{children}</span>
    </div>
  );
}

export default NeedsBackendNotice;
