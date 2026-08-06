import { Button } from "@mumzo/ui/components/button";
import { Plus } from "lucide-react";
import { type Address, AddressCard } from "@/modules/account";

export function ListStep({
  addresses,
  onSelect,
  onUseCurrentLocation,
  selectedAddressId,
}: {
  addresses: Address[];
  onSelect: (address: Address) => void;
  onUseCurrentLocation: () => void;
  selectedAddressId?: string;
}) {
  return (
    <div>
      <div className="mb-4 text-center">
        <h2 className="font-editorial text-2xl text-ink leading-tight">
          Where should we deliver?
        </h2>
        <p className="mt-1 text-foreground/60 text-xs leading-relaxed">
          Pick a saved address, or add a new one.
        </p>
      </div>

      <div className="flex max-h-72 flex-col gap-3 overflow-y-auto">
        {addresses.map((address) => (
          <AddressCard
            key={address.id}
            address={address}
            selectable
            selected={address.id === selectedAddressId}
            onSelect={() => onSelect(address)}
          />
        ))}
      </div>

      <Button
        type="button"
        variant="ghost"
        onClick={onUseCurrentLocation}
        data-testid="web-location-add-new"
        className="mt-4 h-11 w-full cursor-pointer justify-center gap-2 rounded-full border border-border/60 text-foreground/70 text-sm hover:text-primary"
      >
        <Plus size={15} />
        Use current location or add new address
      </Button>
    </div>
  );
}
