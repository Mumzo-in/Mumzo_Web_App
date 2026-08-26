import { Button } from "@mumzo/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@mumzo/ui/components/dialog";
import { Field, FieldGroup } from "@mumzo/ui/components/field";
import { Input } from "@mumzo/ui/components/input";
import { Label } from "@mumzo/ui/components/label";
import { PhoneInput, splitPhone } from "@mumzo/ui/components/phone-input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@mumzo/ui/components/select";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useId, useState } from "react";
import { toast } from "sonner";
import { queryKeys } from "@/core/api/query-keys";
import {
  createRider,
  RIDER_STATUS_LABELS,
  RIDER_STATUSES,
  type Rider,
  updateRider,
  VEHICLE_TYPE_LABELS,
  VEHICLE_TYPES,
} from "../api/riders-api";

type RiderFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Null for a new rider; an existing rider to edit. */
  rider: Rider | null;
};

type FormState = {
  name: string;
  phone: string;
  email: string;
  status: string;
  vehicleType: string;
  vehicleNumber: string;
};

const EMPTY: FormState = {
  name: "",
  phone: "+91",
  email: "",
  status: "active",
  vehicleType: "bike",
  vehicleNumber: "",
};

/** Add or edit a delivery partner. The access code is never entered here —
 * it is generated on create and shown in the table afterwards. */
export function RiderFormDialog({
  open,
  onOpenChange,
  rider,
}: RiderFormDialogProps) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<FormState>(EMPTY);
  const nameId = useId();
  const phoneId = useId();
  const emailId = useId();
  const vehicleNumberId = useId();

  useEffect(() => {
    if (open) {
      setForm(
        rider
          ? {
              name: rider.name,
              phone: rider.phone,
              email: rider.email ?? "",
              status: rider.status,
              vehicleType: rider.vehicleType ?? "bike",
              vehicleNumber: rider.vehicleNumber ?? "",
            }
          : EMPTY,
      );
    }
  }, [open, rider]);

  const mutation = useMutation({
    mutationFn: () => {
      const payload = {
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim() || null,
        status: form.status,
        vehicleType: form.vehicleType || null,
        vehicleNumber: form.vehicleNumber.trim() || null,
      };
      return rider ? updateRider(rider.id, payload) : createRider(payload);
    },
    onSuccess: (saved) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.riders.all });
      toast.success(
        rider
          ? `${saved.name} updated.`
          : `${saved.name} added — delivery code ${saved.accessCode}.`,
      );
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Could not save the rider.",
      );
    },
  });

  // Guard on the local digits, not the whole string — a bare "+91" carries
  // six characters but no actual number.
  const { local: phoneDigits } = splitPhone(form.phone);
  const canSave = form.name.trim().length > 0 && phoneDigits.length >= 6;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {rider ? "Edit delivery partner" : "Add delivery partner"}
          </DialogTitle>
          <DialogDescription>
            {rider
              ? "Update this rider's details."
              : "A delivery code is generated automatically once you save."}
          </DialogDescription>
        </DialogHeader>

        <FieldGroup>
          <Field>
            <Label htmlFor={nameId}>Name</Label>
            <Input
              id={nameId}
              value={form.name}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, name: event.target.value }))
              }
              data-testid="rider-form-name"
            />
          </Field>

          <Field>
            <Label htmlFor={phoneId}>Phone</Label>
            <PhoneInput
              id={phoneId}
              value={form.phone}
              onChange={(phone) => setForm((prev) => ({ ...prev, phone }))}
              data-testid="rider-form-phone"
            />
          </Field>

          <Field>
            <Label htmlFor={emailId}>Email (optional)</Label>
            <Input
              id={emailId}
              type="email"
              value={form.email}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, email: event.target.value }))
              }
              data-testid="rider-form-email"
            />
          </Field>

          <Field>
            <Label>Vehicle</Label>
            <Select
              value={form.vehicleType}
              onValueChange={(value) =>
                setForm((prev) => ({ ...prev, vehicleType: String(value) }))
              }
            >
              <SelectTrigger data-testid="rider-form-vehicle">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {VEHICLE_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {VEHICLE_TYPE_LABELS[type]}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </Field>

          <Field>
            <Label htmlFor={vehicleNumberId}>Vehicle number (optional)</Label>
            <Input
              id={vehicleNumberId}
              value={form.vehicleNumber}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  vehicleNumber: event.target.value,
                }))
              }
              data-testid="rider-form-vehicle-number"
            />
          </Field>

          <Field>
            <Label>Status</Label>
            <Select
              value={form.status}
              onValueChange={(value) =>
                setForm((prev) => ({ ...prev, status: String(value) }))
              }
            >
              <SelectTrigger data-testid="rider-form-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {RIDER_STATUSES.map((status) => (
                    <SelectItem key={status} value={status}>
                      {RIDER_STATUS_LABELS[status]}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </Field>
        </FieldGroup>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            disabled={!canSave || mutation.isPending}
            onClick={() => mutation.mutate()}
            data-testid="rider-form-save"
          >
            {mutation.isPending ? "Saving…" : rider ? "Save" : "Add rider"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default RiderFormDialog;
