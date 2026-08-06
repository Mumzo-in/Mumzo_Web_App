import { Button } from "@mumzo/ui/components/button";
import { Switch } from "@mumzo/ui/components/switch";
import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { queryKeys } from "@/core/api/query-keys";
import PageHeader from "@/core/components/page-header";
import {
  createHub,
  HubForm,
  type HubFormHandle,
  type HubInput,
} from "@/modules/hub";

export const Route = createFileRoute("/(admin)/catalog/hubs/new")({
  component: NewHubPage,
});

function NewHubPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const formRef = useRef<HubFormHandle>(null);
  const [pending, setPending] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [isDefault, setIsDefault] = useState(false);

  async function handleCreate(values: HubInput) {
    const { id } = await createHub(values);
    await queryClient.invalidateQueries({ queryKey: queryKeys.hubs.all });
    toast.success(`Created "${values.name}".`);
    navigate({ to: "/catalog/hubs/$hubId", params: { hubId: id } });
  }

  return (
    <>
      <PageHeader
        actions={
          <>
            <div className="flex items-center gap-2">
              <Switch
                checked={isActive}
                data-testid="admin-hub-active-header"
                onCheckedChange={(checked) => {
                  setIsActive(checked);
                  formRef.current?.setIsActive(checked);
                }}
              />
              <span className="text-muted-foreground text-sm">
                {isActive ? "Active" : "Inactive"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={isDefault}
                data-testid="admin-hub-default-header"
                onCheckedChange={(checked) => {
                  setIsDefault(checked);
                  formRef.current?.setIsDefault(checked);
                }}
              />
              <span className="text-muted-foreground text-sm">Default hub</span>
            </div>
            <Button
              data-testid="admin-hub-submit-header"
              disabled={pending}
              onClick={() => formRef.current?.submit()}
              type="button"
            >
              {pending ? "Creating…" : "Create hub"}
            </Button>
          </>
        }
        description="Hubs are the dark stores orders are fulfilled from."
        title="New hub"
      />
      <HubForm
        onIsActiveChange={setIsActive}
        onIsDefaultChange={setIsDefault}
        onPendingChange={setPending}
        onSubmit={handleCreate}
        ref={formRef}
      />
    </>
  );
}
