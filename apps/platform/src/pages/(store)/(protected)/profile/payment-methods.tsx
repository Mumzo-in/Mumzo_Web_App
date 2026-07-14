import { Button } from "@mumzo/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@mumzo/ui/components/dialog";
import { Input } from "@mumzo/ui/components/input";
import { Label } from "@mumzo/ui/components/label";
import { createFileRoute } from "@tanstack/react-router";
import { CreditCard, Plus, Smartphone, Star, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import Breadcrumbs from "@/core/components/breadcrumbs";
import { type PaymentKind, usePaymentMethods } from "@/modules/account";

export const Route = createFileRoute(
  "/(store)/(protected)/profile/payment-methods",
)({
  component: PaymentMethodsPage,
});

function PaymentMethodsPage() {
  const { methods, addMethod, removeMethod, setDefault } = usePaymentMethods();
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<PaymentKind>("upi");
  const [value, setValue] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim()) {
      toast.error(kind === "upi" ? "Enter a UPI ID" : "Enter card number");
      return;
    }
    addMethod(
      kind === "upi"
        ? { kind, label: value.trim(), detail: "UPI" }
        : {
            kind,
            label: "Card",
            detail: `•••• ${value.trim().slice(-4)}`,
          },
    );
    toast.success("Payment method added");
    setValue("");
    setOpen(false);
  };

  return (
    <div className="mx-auto w-full max-w-7xl px-4 pt-8 pb-16">
      <Breadcrumbs
        items={[
          { label: "Home", to: "/" },
          { label: "Account", to: "/profile" },
          { label: "Payment methods" },
        ]}
      />

      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <h1 className="font-editorial text-3xl text-ink leading-none tracking-tight sm:text-4xl">
          Payment methods
        </h1>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-primary px-5 py-2.5 font-semibold text-primary-foreground text-sm transition-colors hover:bg-primary/95"
        >
          <Plus size={15} />
          Add method
        </button>
      </div>

      <div className="grid max-w-2xl gap-3">
        {methods.map((m) => (
          <div
            key={m.id}
            className="flex items-center gap-4 rounded-3xl border border-border/60 bg-white p-5"
          >
            <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-accent/40 text-primary">
              {m.kind === "upi" ? (
                <Smartphone size={19} />
              ) : (
                <CreditCard size={19} />
              )}
            </span>
            <div className="flex-1">
              <p className="flex items-center gap-2 font-semibold text-ink text-sm">
                {m.label}
                {m.isDefault && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 font-semibold text-primary text-xs">
                    <Star size={10} />
                    Default
                  </span>
                )}
              </p>
              <p className="text-foreground/55 text-xs">{m.detail}</p>
            </div>
            {!m.isDefault && (
              <button
                type="button"
                onClick={() => setDefault(m.id)}
                className="cursor-pointer rounded-full border border-border px-3 py-1.5 font-semibold text-foreground/70 text-xs transition-colors hover:bg-secondary"
              >
                Set default
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                removeMethod(m.id);
                toast.success("Removed");
              }}
              aria-label="Remove"
              className="flex size-9 cursor-pointer items-center justify-center rounded-full border border-destructive/30 text-destructive transition-colors hover:bg-destructive/10"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="w-[calc(100vw-2rem)] max-w-md rounded-3xl p-6">
          <DialogTitle className="mb-4 font-editorial text-ink text-xl">
            Add payment method
          </DialogTitle>
          <form onSubmit={submit} className="flex flex-col gap-4">
            <div className="flex gap-2">
              {(["upi", "card"] as PaymentKind[]).map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setKind(k)}
                  className={`flex-1 cursor-pointer rounded-full border px-4 py-2 font-semibold text-sm transition-colors ${
                    kind === k
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border text-foreground/70 hover:bg-secondary"
                  }`}
                >
                  {k === "upi" ? "UPI" : "Card"}
                </button>
              ))}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="pm-value">
                {kind === "upi" ? "UPI ID" : "Card number"}
              </Label>
              <Input
                id="pm-value"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder={
                  kind === "upi" ? "name@bank" : "4111 1111 1111 1111"
                }
              />
            </div>
            <Button type="submit" className="rounded-full">
              Save
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
