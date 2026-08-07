import { Button } from "@mumzo/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@mumzo/ui/components/dialog";
import { Activity, Clock, Eye, Globe, Terminal, User } from "lucide-react";
import { useState } from "react";
import { formatDateTime } from "@/core/components/format";

export type ActivityLog = {
  id: string;
  staffUserId: string;
  staffUserName: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  description: string;
  previousValues: unknown | null;
  newValues: unknown | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
};

type TimelineProps = {
  logs: ActivityLog[];
};

export function ActivityLogsTimeline({ logs }: TimelineProps) {
  const [selectedLog, setSelectedLog] = useState<ActivityLog | null>(null);

  if (logs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-border border-dashed bg-card p-12 text-center">
        <Activity className="mb-3 h-12 w-12 animate-pulse text-muted-foreground/60" />
        <h3 className="font-semibold text-lg">No activities recorded</h3>
        <p className="mt-1 max-w-sm text-muted-foreground text-sm">
          Perform admin operations like updating products or managing inventory
          to see logs populated.
        </p>
      </div>
    );
  }

  return (
    <div className="relative ml-4 space-y-6 border-border/80 border-l-2 pl-6">
      {logs.map((log) => (
        <div key={log.id} className="group relative">
          {/* Dot Indicator */}
          <span className="absolute top-1.5 -left-[31px] flex h-4 w-4 items-center justify-center rounded-full border-2 border-primary bg-background transition-transform group-hover:scale-110">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
          </span>

          <div className="flex flex-col justify-between gap-4 rounded-xl border border-border/60 bg-card p-4 transition-shadow hover:shadow-sm md:flex-row md:items-center">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded border border-primary/20 bg-primary/10 px-2 py-0.5 font-semibold text-primary text-xs">
                  {log.action}
                </span>
                <span className="flex items-center gap-1 text-muted-foreground text-xs">
                  <Clock className="h-3.5 w-3.5" />
                  {formatDateTime(log.createdAt)}
                </span>
              </div>
              <p className="font-medium text-foreground text-sm">
                {log.description}
              </p>
              <div className="flex items-center gap-3 pt-1 text-muted-foreground text-xs">
                <span className="flex items-center gap-1">
                  <User className="h-3.5 w-3.5 text-primary/70" />
                  {log.staffUserName ||
                    `User ID: ${log.staffUserId.slice(0, 8)}`}
                </span>
                {log.ipAddress && (
                  <span className="flex items-center gap-1">
                    <Globe className="h-3.5 w-3.5" />
                    {log.ipAddress}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedLog(log)}
                className="flex items-center gap-1.5"
              >
                <Eye className="h-4 w-4" />
                Inspect
              </Button>
            </div>
          </div>
        </div>
      ))}

      {/* Inspect Log Dialog */}
      <Dialog
        open={selectedLog !== null}
        onOpenChange={(open) => !open && setSelectedLog(null)}
      >
        {selectedLog && (
          <DialogContent className="max-h-[85vh] max-w-3xl overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                Inspect Administrative Action
              </DialogTitle>
            </DialogHeader>

            <div className="my-2 space-y-4">
              {/* Summary Block */}
              <div className="space-y-2 rounded-lg border border-border/50 bg-muted/65 p-4">
                <h4 className="font-semibold text-sm">
                  {selectedLog.description}
                </h4>
                <div className="grid grid-cols-1 gap-3 border-border/30 border-t pt-1 text-xs md:grid-cols-2">
                  <div className="space-y-1">
                    <p className="text-muted-foreground">Actor</p>
                    <p className="font-medium text-foreground">
                      {selectedLog.staffUserName || "System"}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-muted-foreground">Action / Scope</p>
                    <p className="font-medium text-foreground">
                      {selectedLog.action} ({selectedLog.entityType})
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-muted-foreground">IP Address</p>
                    <p className="font-medium text-foreground">
                      {selectedLog.ipAddress || "N/A"}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-muted-foreground">Recorded At</p>
                    <p className="font-medium text-foreground">
                      {formatDateTime(selectedLog.createdAt)}
                    </p>
                  </div>
                </div>
                {selectedLog.userAgent && (
                  <div className="flex items-start gap-1 border-border/30 border-t pt-2 font-mono text-[10px] text-muted-foreground">
                    <Terminal className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
                    <span>UA: {selectedLog.userAgent}</span>
                  </div>
                )}
              </div>

              {/* JSON diff display */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-1.5">
                  <span className="font-semibold text-muted-foreground text-xs">
                    Pre-Change Value
                  </span>
                  <div className="max-h-64 overflow-auto rounded-lg border border-border bg-muted/30 p-3 font-mono text-[11px]">
                    {selectedLog.previousValues ? (
                      <pre className="text-foreground">
                        {JSON.stringify(selectedLog.previousValues, null, 2)}
                      </pre>
                    ) : (
                      <span className="text-muted-foreground italic">None</span>
                    )}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <span className="font-semibold text-muted-foreground text-xs">
                    Post-Change Value
                  </span>
                  <div className="max-h-64 overflow-auto rounded-lg border border-border bg-muted/30 p-3 font-mono text-[11px]">
                    {selectedLog.newValues ? (
                      <pre className="text-foreground">
                        {JSON.stringify(selectedLog.newValues, null, 2)}
                      </pre>
                    ) : (
                      <span className="text-muted-foreground italic">None</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedLog(null)}>
                Close Inspection
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
