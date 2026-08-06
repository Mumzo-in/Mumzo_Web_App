import { Button } from "@mumzo/ui/components/button";
import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { queryKeys } from "@/core/api/query-keys";
import PageHeader from "@/core/components/page-header";
import {
  BrandForm,
  type BrandFormHandle,
  type BrandInput,
  createBrand,
} from "@/modules/brand";

export const Route = createFileRoute("/(admin)/catalog/brands/new")({
  component: NewBrandPage,
});

function NewBrandPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const formRef = useRef<BrandFormHandle>(null);
  const [pending, setPending] = useState(false);

  async function handleCreate(values: BrandInput) {
    const { id } = await createBrand(values);
    await queryClient.invalidateQueries({ queryKey: queryKeys.brands.all });
    toast.success(`Created "${values.name}".`);
    navigate({ to: "/catalog/brands/$brandId", params: { brandId: id } });
  }

  return (
    <>
      <PageHeader
        actions={
          <Button
            data-testid="admin-brand-submit-header"
            disabled={pending}
            onClick={() => formRef.current?.submit()}
            type="button"
          >
            {pending ? "Creating…" : "Create brand"}
          </Button>
        }
        description="Brands are what products and categories are organized under."
        title="New brand"
      />
      <BrandForm
        onPendingChange={setPending}
        onSubmit={handleCreate}
        ref={formRef}
      />
    </>
  );
}
