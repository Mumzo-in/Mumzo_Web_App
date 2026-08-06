import { Button } from "@mumzo/ui/components/button";
import { Switch } from "@mumzo/ui/components/switch";
import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { queryKeys } from "@/core/api/query-keys";
import PageHeader from "@/core/components/page-header";
import {
  createVendor,
  VendorForm,
  type VendorFormHandle,
  type VendorInput,
} from "@/modules/vendor";

export const Route = createFileRoute("/(admin)/catalog/vendors/new")({
  component: NewVendorPage,
});

function NewVendorPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const formRef = useRef<VendorFormHandle>(null);
  const [pending, setPending] = useState(false);
  const [isActive, setIsActive] = useState(true);

  async function handleCreate(values: VendorInput) {
    const { id } = await createVendor(values);
    await queryClient.invalidateQueries({ queryKey: queryKeys.vendors.all });
    toast.success(`Created "${values.name}".`);
    navigate({ to: "/catalog/vendors/$vendorId", params: { vendorId: id } });
  }

  return (
    <>
      <PageHeader
        actions={
          <>
            <div className="flex items-center gap-2">
              <Switch
                checked={isActive}
                data-testid="admin-vendor-active-header"
                onCheckedChange={(checked) => {
                  setIsActive(checked);
                  formRef.current?.setIsActive(checked);
                }}
              />
              <span className="text-muted-foreground text-sm">
                {isActive ? "Active" : "Inactive"}
              </span>
            </div>
            <Button
              data-testid="admin-vendor-submit-header"
              disabled={pending}
              onClick={() => formRef.current?.submit()}
              type="button"
            >
              {pending ? "Creating…" : "Create vendor"}
            </Button>
          </>
        }
        description="Vendors supply the products stocked in your catalog."
        title="New vendor"
      />
      <VendorForm
        onIsActiveChange={setIsActive}
        onPendingChange={setPending}
        onSubmit={handleCreate}
        ref={formRef}
      />
    </>
  );
}
