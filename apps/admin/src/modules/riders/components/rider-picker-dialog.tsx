import { Badge } from "@mumzo/ui/components/badge";
import { Button } from "@mumzo/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@mumzo/ui/components/dialog";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@mumzo/ui/components/empty";
import { Input } from "@mumzo/ui/components/input";
import { Skeleton } from "@mumzo/ui/components/skeleton";
import { cn } from "@mumzo/ui/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { queryKeys } from "@/core/api/query-keys";
import { listRiders, type Rider } from "../api/riders-api";

type RiderPickerDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (rider: Rider) => void;
  orderLabel?: string;
};

/** Choose who takes an order out. Shown before dispatch, because the delivery
 * link is bound to one rider the moment it is minted. */
export function RiderPickerDialog({
  open,
  onOpenChange,
  onConfirm,
  orderLabel,
}: RiderPickerDialogProps) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Rider | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.riders.list({ status: "active", search }),
    queryFn: () => listRiders({ status: "active", search, limit: 50 }),
    enabled: open,
  });

  const riders = data?.data ?? [];

  function handleOpenChange(next: boolean) {
    if (!next) {
      setSearch("");
      setSelected(null);
    }
    onOpenChange(next);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Who is taking this order?</DialogTitle>
          <DialogDescription>
            {orderLabel ? `${orderLabel} — ` : ""}the delivery link is issued to
            this rider, and only their code will open it.
          </DialogDescription>
        </DialogHeader>

        <Input
          placeholder="Search by name or phone…"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          data-testid="rider-picker-search"
        />

        <div className="flex max-h-72 flex-col gap-2 overflow-y-auto">
          {isLoading ? (
            <>
              <Skeleton className="h-14 w-full rounded-2xl" />
              <Skeleton className="h-14 w-full rounded-2xl" />
            </>
          ) : riders.length === 0 ? (
            <Empty data-testid="rider-picker-empty">
              <EmptyHeader>
                <EmptyTitle>No active riders</EmptyTitle>
                <EmptyDescription>
                  Add a delivery partner under Operations → Delivery partners
                  first.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            riders.map((rider) => (
              <button
                key={rider.id}
                type="button"
                onClick={() => setSelected(rider)}
                data-testid={`rider-picker-${rider.id}`}
                className={cn(
                  "flex items-center justify-between gap-3 rounded-2xl border border-border/60 px-4 py-3 text-left transition-colors hover:bg-accent/40",
                  selected?.id === rider.id && "border-primary bg-accent/60",
                )}
              >
                <div className="flex flex-col gap-0.5">
                  <span className="font-medium text-foreground text-sm">
                    {rider.name}
                  </span>
                  <span className="numeric text-muted-foreground text-xs">
                    {rider.phone}
                    {rider.hubName ? ` · ${rider.hubName}` : ""}
                  </span>
                </div>
                {rider.vehicleType ? (
                  <Badge variant="secondary">{rider.vehicleType}</Badge>
                ) : null}
              </button>
            ))
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button
            disabled={!selected}
            onClick={() => {
              if (selected) {
                onConfirm(selected);
                handleOpenChange(false);
              }
            }}
            data-testid="rider-picker-confirm"
          >
            Dispatch
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default RiderPickerDialog;
