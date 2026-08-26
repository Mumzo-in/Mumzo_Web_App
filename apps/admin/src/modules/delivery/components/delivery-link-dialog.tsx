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
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@mumzo/ui/components/empty";
import { Field, FieldGroup } from "@mumzo/ui/components/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@mumzo/ui/components/input-group";
import { Label } from "@mumzo/ui/components/label";
import { Skeleton } from "@mumzo/ui/components/skeleton";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Copy, MessageCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { queryKeys } from "@/core/api/query-keys";
import {
  type AdminOrderSummary,
  assignOrderRider,
  getOrderDeliveryLink,
} from "@/modules/orders";
import { RiderPickerDialog } from "@/modules/riders";
import { buildDeliveryLink } from "../api/delivery-api";

type DeliveryLinkDialogProps = {
  order: AdminOrderSummary | null;
  onOpenChange: (open: boolean) => void;
};

/**
 * Shown after ops dispatches an order — the link plus the assigned rider's
 * code, which are useless apart. WhatsApp is the intended channel, so the
 * primary action opens a prefilled `wa.me` draft the operator sends from
 * their own account; no messaging integration needed yet.
 */
export function DeliveryLinkDialog({
  order,
  onOpenChange,
}: DeliveryLinkDialogProps) {
  const [copiedField, setCopiedField] = useState<"link" | "code" | null>(null);
  const [picking, setPicking] = useState(false);
  const queryClient = useQueryClient();

  // The token is minted server-side on dispatch, so it has to be fetched
  // rather than derived — that is what makes the link unguessable.
  const { data, isLoading } = useQuery({
    queryKey: [...queryKeys.orders.detail(order?.id ?? ""), "delivery-link"],
    queryFn: () => getOrderDeliveryLink(order?.id as string),
    enabled: order !== null,
  });

  const assign = useMutation({
    mutationFn: (riderId: string) =>
      assignOrderRider(order?.id as string, riderId),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.orders.detail(order?.id ?? ""),
      });
      toast.success("Rider assigned — link ready to share.");
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Could not assign the rider.",
      );
    },
  });

  const link = data?.token ? buildDeliveryLink(data.token) : "";
  const code = data?.accessCode ?? "";
  const ready = Boolean(link && code);

  const waHref = ready
    ? `https://wa.me/${(data?.riderPhone ?? "").replace(/[^\d]/g, "")}?text=${encodeURIComponent(
        `Mumzo delivery — order #${(order?.id ?? "")
          .slice(0, 8)
          .toUpperCase()}.\n\nOpen: ${link}\nYour code: ${code}`,
      )}`
    : "";

  async function copy(value: string, field: "link" | "code") {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      toast.error("Could not copy.");
    }
  }

  function handleOpenChange(open: boolean) {
    if (!open) {
      setCopiedField(null);
    }
    onOpenChange(open);
  }

  return (
    <Dialog open={order !== null} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Share the delivery link</DialogTitle>
          <DialogDescription>
            {ready
              ? `Order #${(order?.id ?? "").slice(0, 8).toUpperCase()} is assigned to ${data?.riderName}. Send them both the link and their code — the link stays valid until an outcome is recorded.`
              : `Order #${(order?.id ?? "").slice(0, 8).toUpperCase()}`}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex flex-col gap-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : !data?.token ? (
          <Empty data-testid="delivery-link-missing">
            <EmptyHeader>
              <EmptyTitle>No delivery link yet</EmptyTitle>
              <EmptyDescription>
                This order was dispatched before a rider was assigned, so no
                link exists. Move it back and dispatch it again, choosing a
                rider — or assign one now.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button
                onClick={() => setPicking(true)}
                disabled={assign.isPending}
                data-testid="delivery-link-assign"
              >
                Assign a rider
              </Button>
            </EmptyContent>
          </Empty>
        ) : !code ? (
          <Empty data-testid="delivery-link-no-code">
            <EmptyHeader>
              <EmptyTitle>Rider has no delivery code</EmptyTitle>
              <EmptyDescription>
                {data.riderName
                  ? `${data.riderName} has no code yet — open Operations → Delivery Partners and use "New code".`
                  : "This link has no rider assigned, so there is no code to share. Re-dispatch the order and choose a rider."}
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <FieldGroup>
            <Field>
              <Label>Delivery link</Label>
              <InputGroup>
                <InputGroupInput
                  readOnly
                  value={link}
                  data-testid="delivery-link"
                />
                <InputGroupAddon align="inline-end">
                  <InputGroupButton
                    onClick={() => copy(link, "link")}
                    data-testid="delivery-link-copy"
                    aria-label="Copy delivery link"
                  >
                    {copiedField === "link" ? (
                      <Check data-icon />
                    ) : (
                      <Copy data-icon />
                    )}
                  </InputGroupButton>
                </InputGroupAddon>
              </InputGroup>
            </Field>

            <Field>
              <Label>{data.riderName}'s code</Label>
              <InputGroup>
                <InputGroupInput
                  readOnly
                  value={code}
                  className="numeric font-semibold tracking-widest"
                  data-testid="delivery-code"
                />
                <InputGroupAddon align="inline-end">
                  <InputGroupButton
                    onClick={() => copy(code, "code")}
                    data-testid="delivery-code-copy"
                    aria-label="Copy delivery code"
                  >
                    {copiedField === "code" ? (
                      <Check data-icon />
                    ) : (
                      <Copy data-icon />
                    )}
                  </InputGroupButton>
                </InputGroupAddon>
              </InputGroup>
            </Field>
          </FieldGroup>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Done
          </Button>
          {ready ? (
            <Button
              data-testid="delivery-link-whatsapp"
              render={<a href={waHref} target="_blank" rel="noreferrer" />}
            >
              <MessageCircle data-icon />
              Share on WhatsApp
            </Button>
          ) : null}
        </DialogFooter>
      </DialogContent>

      <RiderPickerDialog
        open={picking}
        onOpenChange={setPicking}
        onConfirm={(rider) => assign.mutate(rider.id)}
        orderLabel={
          order ? `#${order.id.slice(0, 8).toUpperCase()}` : undefined
        }
      />
    </Dialog>
  );
}

export default DeliveryLinkDialog;
