import { Card, CardContent } from "@mumzo/ui/components/card";
import { Loader2 } from "lucide-react";

/**
 * Step 4 — the chunked import runs synchronously inside one request/response
 * cycle server-side (see `imports.service.ts: runJob`), so there is no
 * incremental progress to poll for. This is deliberately a busy state, not a
 * progress bar — showing a fake 0→100% jump would misrepresent what's
 * actually happening. No back/cancel while in flight; a batch already
 * committed can't be safely un-done mid-run.
 */
export default function ImportProgress({ rowCount }: { rowCount: number }) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
        <Loader2 className="animate-spin text-primary" size={28} />
        <p className="font-medium text-sm">
          Importing {rowCount} product{rowCount === 1 ? "" : "s"}…
        </p>
        <p className="text-muted-foreground text-xs">
          This runs in batches of 20 on the server. Please keep this tab open —
          it'll move to the summary automatically when it's done.
        </p>
      </CardContent>
    </Card>
  );
}
