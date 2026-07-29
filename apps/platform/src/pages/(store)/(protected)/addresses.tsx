import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@mumzo/ui/components/dialog";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@mumzo/ui/components/empty";
import { Skeleton } from "@mumzo/ui/components/skeleton";
import { createFileRoute } from "@tanstack/react-router";
import { MapPin, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import Breadcrumbs from "@/core/components/breadcrumbs";
import {
  type Address,
  AddressCard,
  AddressForm,
  useAddresses,
} from "@/modules/account";

export const Route = createFileRoute("/(store)/(protected)/addresses")({
  component: AddressesPage,
});

function AddressesPage() {
  const {
    addresses,
    isLoading,
    addAddress,
    updateAddress,
    removeAddress,
    setDefault,
  } = useAddresses();
  const [editing, setEditing] = useState<Address | null>(null);
  const [open, setOpen] = useState(false);

  const openAdd = () => {
    setEditing(null);
    setOpen(true);
  };

  const openEdit = (address: Address) => {
    setEditing(address);
    setOpen(true);
  };

  return (
    <div className="mx-auto pt-8 pb-16">
      <Breadcrumbs
        items={[
          { label: "Home", to: "/" },
          { label: "Account", to: "/profile" },
          { label: "Addresses" },
        ]}
      />

      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-editorial text-3xl text-ink leading-none tracking-tight sm:text-4xl">
            Saved addresses
          </h1>
          <p className="mt-2 text-foreground/60 text-sm">
            Manage where your orders are delivered.
          </p>
        </div>
        <button
          type="button"
          onClick={openAdd}
          data-testid="web-add-address"
          className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-primary px-5 py-2.5 font-semibold text-primary-foreground text-sm transition-colors hover:bg-primary/95"
        >
          <Plus size={15} />
          Add address
        </button>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <Skeleton className="h-40 rounded-3xl" />
          <Skeleton className="h-40 rounded-3xl" />
        </div>
      ) : addresses.length === 0 ? (
        <Empty className="rounded-3xl border border-border/60 border-dashed">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <MapPin />
            </EmptyMedia>
            <EmptyTitle>No saved addresses yet</EmptyTitle>
            <EmptyDescription>
              Add a delivery address to check out faster next time.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <button
              type="button"
              onClick={openAdd}
              data-testid="web-add-address-empty"
              className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-primary px-5 py-2.5 font-semibold text-primary-foreground text-sm transition-colors hover:bg-primary/95"
            >
              <Plus size={15} />
              Add address
            </button>
          </EmptyContent>
        </Empty>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {addresses.map((address) => (
            <AddressCard
              key={address.id}
              address={address}
              onEdit={() => openEdit(address)}
              onDelete={async () => {
                await removeAddress(address.id);
                toast.success("Address removed");
              }}
              onSetDefault={async () => {
                await setDefault(address.id);
                toast.success("Default address updated");
              }}
            />
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogTitle className="mb-4 font-editorial text-ink text-xl">
            {editing ? "Edit address" : "Add a new address"}
          </DialogTitle>
          <AddressForm
            initial={editing ?? undefined}
            existing={addresses}
            onSubmit={async (draft) => {
              if (editing) {
                await updateAddress(editing.id, draft);
                toast.success("Address updated");
              } else {
                await addAddress(draft);
                toast.success("Address added");
              }
              setOpen(false);
            }}
            onCancel={() => setOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
