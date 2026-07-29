import { type Address, AddressForm } from "@/modules/account";
import type { ResolvedLocation } from "../../hooks/use-location-flow";
import { StepBackButton } from "./step-back-button";

export function SaveAddressStep({
  resolved,
  existing,
  onBack,
  onSave,
  onSkip,
}: {
  resolved: ResolvedLocation;
  existing: Address[];
  onBack: () => void;
  onSave: (draft: Omit<Address, "id">) => void;
  onSkip: () => void;
}) {
  return (
    <div>
      <StepBackButton onBack={onBack} />
      <div className="mb-4 text-center">
        <h2 className="font-editorial text-2xl text-ink leading-tight">
          Save this address?
        </h2>
        <p className="mt-1 text-foreground/60 text-xs leading-relaxed">
          Add the details below to save it for faster checkout next time.
        </p>
      </div>

      <AddressForm
        existing={existing}
        initial={{
          id: "",
          label: "Home",
          name: "",
          phone: "",
          line1: "",
          line2: resolved.line2,
          landmark: "",
          pincode: resolved.pincode,
          city: resolved.city,
          isDefault: existing.length === 0,
        }}
        onSubmit={onSave}
        onCancel={onSkip}
      />
    </div>
  );
}
