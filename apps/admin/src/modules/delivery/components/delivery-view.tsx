import { Badge } from "@mumzo/ui/components/badge";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@mumzo/ui/components/empty";
import { Skeleton } from "@mumzo/ui/components/skeleton";
import { cn } from "@mumzo/ui/lib/utils";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { formatDateTime } from "@/core/components/format";
import {
  completeDeliveryRun,
  getDeliveryLinkStatus,
  unlockDeliveryRun,
} from "../api/delivery-api";
import {
  DELIVERY_OUTCOME_META,
  type DeliveryOutcome,
  type DeliveryRun,
} from "../data/delivery-data";
import DeliveryActionPanel from "./delivery-action-panel";
import DeliveryCodeGate from "./delivery-code-gate";
import DeliveryCustomerCard from "./delivery-customer-card";
import DeliveryOrderCard from "./delivery-order-card";

type DeliveryViewProps = {
  token: string;
};

/**
 * The whole rider screen — a code gate in front of the delivery details.
 *
 * The page holds no session: the rider's code lives in component state for the
 * life of the tab and is re-sent with each call. That is why closing the tab
 * simply means entering the code again, and why the link itself stays valid
 * until an outcome is recorded.
 */
export function DeliveryView({ token }: DeliveryViewProps) {
  const [code, setCode] = useState<string | null>(null);
  const [run, setRun] = useState<DeliveryRun | null>(null);
  const [codeError, setCodeError] = useState<string | null>(null);

  const { data: status, isLoading } = useQuery({
    queryKey: ["delivery", "status", token],
    queryFn: () => getDeliveryLinkStatus(token),
    enabled: token.length > 0,
    retry: false,
  });

  const unlock = useMutation({
    mutationFn: (entered: string) => unlockDeliveryRun(token, entered),
    onSuccess: (data, entered) => {
      setRun(data);
      setCode(entered);
      setCodeError(null);
    },
    onError: (error) => {
      setCodeError(
        error instanceof Error ? error.message : "Could not check that code.",
      );
    },
  });

  const complete = useMutation({
    mutationFn: ({
      outcome,
      reason,
    }: {
      outcome: DeliveryOutcome;
      reason?: string;
    }) =>
      completeDeliveryRun({
        token,
        code: code as string,
        outcome,
        reason,
      }),
    onSuccess: (data) => {
      setRun(data);
      toast.success(
        `Order marked ${DELIVERY_OUTCOME_META[
          data.status as DeliveryOutcome
        ].label.toLowerCase()}.`,
      );
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Could not update the order.",
      );
    },
  });

  if (token.length === 0) {
    return <InvalidLink />;
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-32 w-full rounded-2xl" />
        <Skeleton className="h-48 w-full rounded-2xl" />
      </div>
    );
  }

  if (!status) {
    return <InvalidLink />;
  }

  if (status.lockedOut) {
    return (
      <Empty data-testid="delivery-locked-out">
        <EmptyHeader>
          <EmptyTitle>Link locked</EmptyTitle>
          <EmptyDescription>
            Too many incorrect codes were entered. Ask ops to send a fresh link.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  if (!run) {
    return (
      <div className="flex flex-col gap-4">
        <Header />
        <DeliveryCodeGate
          onSubmit={(entered) => unlock.mutate(entered)}
          pending={unlock.isPending}
          error={codeError}
        />
      </div>
    );
  }

  const isComplete = run.status !== "out_for_delivery";
  const outcomeMeta = isComplete
    ? DELIVERY_OUTCOME_META[run.status as DeliveryOutcome]
    : null;

  return (
    <div className="flex flex-col gap-4">
      <Header
        hubName={run.hubName}
        dispatchedAt={run.dispatchedAt}
        riderName={run.riderName}
        badge={
          outcomeMeta ? (
            <Badge
              className={cn(outcomeMeta.tint)}
              data-testid="delivery-status"
            >
              {outcomeMeta.label}
            </Badge>
          ) : (
            <Badge variant="secondary" data-testid="delivery-status">
              Out for delivery
            </Badge>
          )
        }
      />

      <DeliveryCustomerCard run={run} />
      <DeliveryOrderCard run={run} />

      {isComplete ? (
        <Empty data-testid="delivery-complete">
          <EmptyHeader>
            <EmptyTitle>{outcomeMeta?.label}</EmptyTitle>
            <EmptyDescription>
              {run.completionReason
                ? `Reason: ${run.completionReason}`
                : "Thanks — nothing more to do for this order."}
              {run.completedAt ? ` · ${formatDateTime(run.completedAt)}` : null}
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <DeliveryActionPanel
          pending={complete.isPending}
          onSubmit={(outcome, reason) => complete.mutate({ outcome, reason })}
        />
      )}
    </div>
  );
}

function Header({
  hubName,
  dispatchedAt,
  riderName,
  badge,
}: {
  hubName?: string;
  dispatchedAt?: string;
  riderName?: string | null;
  badge?: React.ReactNode;
} = {}) {
  return (
    <header className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <h1 className="font-editorial text-2xl tracking-tighter">
          Delivery run
        </h1>
        {badge}
      </div>
      {hubName ? (
        <p className="text-muted-foreground text-sm">
          {hubName}
          {dispatchedAt ? ` · dispatched ${formatDateTime(dispatchedAt)}` : ""}
          {riderName ? ` · ${riderName}` : ""}
        </p>
      ) : null}
    </header>
  );
}

function InvalidLink() {
  return (
    <Empty data-testid="delivery-invalid">
      <EmptyHeader>
        <EmptyTitle>Link not valid</EmptyTitle>
        <EmptyDescription>
          This delivery link does not exist. Ask ops to send a fresh one.
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}

export default DeliveryView;
