import { Button } from "@mumzo/ui/components/button";
import { Card, CardContent } from "@mumzo/ui/components/card";
import { CheckCircle2, Download } from "lucide-react";
import type { ImportJob } from "../api/imports-api";

/** Step 5 — final counts once the chunked run has completed. */
export default function ImportSummary({
  job,
  onImportAnother,
  onGoToProducts,
}: {
  job: ImportJob;
  onImportAnother: () => void;
  onGoToProducts: () => void;
}) {
  const skipped = Math.max(
    job.totalRows - job.successCount - job.failureCount,
    0,
  );

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardContent className="flex flex-col items-center gap-4 py-8 text-center">
          <div className="flex items-center gap-2 font-semibold text-lg">
            <CheckCircle2 className="text-primary" size={20} />
            Import finished
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-md border p-4">
              <p className="font-semibold text-2xl">{job.successCount}</p>
              <p className="text-muted-foreground text-xs">Created</p>
            </div>
            <div className="rounded-md border p-4">
              <p className="font-semibold text-2xl">{job.failureCount}</p>
              <p className="text-muted-foreground text-xs">Failed</p>
            </div>
            <div className="rounded-md border p-4">
              <p className="font-semibold text-2xl">{skipped}</p>
              <p className="text-muted-foreground text-xs">Skipped</p>
            </div>
          </div>

          {job.failureCount > 0 && (
            <Button variant="outline" size="sm" disabled>
              <Download className="mr-1.5" size={14} />
              Download error report
            </Button>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-center gap-3">
        <Button variant="outline" onClick={onImportAnother}>
          Import another file
        </Button>
        <Button onClick={onGoToProducts}>Go to Products →</Button>
      </div>
    </div>
  );
}
