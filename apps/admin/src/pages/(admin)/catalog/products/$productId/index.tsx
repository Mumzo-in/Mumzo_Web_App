import { discountPct } from "@mumzo/schema";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@mumzo/ui/components/alert-dialog";
import { Badge } from "@mumzo/ui/components/badge";
import { Button } from "@mumzo/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@mumzo/ui/components/card";
import { Skeleton } from "@mumzo/ui/components/skeleton";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Images, PackageOpen, Pencil, Power, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { queryKeys } from "@/core/api/query-keys";
import { formatMoney, formatNumber } from "@/core/components/format";
import PageHeader from "@/core/components/page-header";
import StatusChip from "@/core/components/status-chip";
import {
  deleteProduct,
  getProduct,
  PRODUCT_STATUS_META,
  updateProduct,
} from "@/modules/operations/products";
import { usePermission } from "@/modules/roles";

export const Route = createFileRoute("/(admin)/catalog/products/$productId/")({
  component: ProductDetailPage,
});

function ProductDetailPage() {
  const { productId } = Route.useParams();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [togglingStatus, setTogglingStatus] = useState(false);
  const canDelete = usePermission("product", "delete");
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const { data, isLoading, error } = useQuery({
    queryKey: queryKeys.products.detail(productId),
    queryFn: () => getProduct(productId),
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteProduct(productId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.products.all,
      });
      toast.success("Product deleted.");
      navigate({ to: "/catalog/products" });
    },
    onError: (deleteError: Error) => {
      toast.error(deleteError.message || "Could not delete the product.");
      setConfirmingDelete(false);
    },
  });

  if (isLoading) {
    return <Skeleton className="h-64 rounded-2xl" />;
  }

  if (error || !data) {
    return (
      <PageHeader
        title="Product not found"
        description="This product doesn't exist or was removed."
      />
    );
  }

  const status = PRODUCT_STATUS_META[data.status];
  const off = discountPct(data);
  const isActive = data.status === "active";

  async function toggleActive() {
    if (!data) {
      return;
    }
    setTogglingStatus(true);
    try {
      const nextStatus = isActive ? "inactive" : "active";
      await updateProduct(data.id, {
        ...data,
        brandId: data.brandId,
        vendor: data.vendor
          ? {
              vendorId: data.vendor.vendorId,
              relationship: data.vendor.relationship,
              costPrice: data.vendor.costPrice,
              leadTimeDays: data.vendor.leadTimeDays,
              notes: data.vendor.notes,
            }
          : null,
        status: nextStatus,
      });
      await queryClient.invalidateQueries({
        queryKey: queryKeys.products.all,
      });
      toast.success(
        nextStatus === "active" ? "Product activated." : "Product deactivated.",
      );
    } catch (toggleError) {
      toast.error(
        toggleError instanceof Error
          ? toggleError.message
          : "Couldn't update the product's status.",
      );
    } finally {
      setTogglingStatus(false);
    }
  }

  return (
    <>
      <PageHeader
        title={data.name}
        description={`${data.sku} · ${data.brand}`}
        actions={
          <>
            <Button
              variant="outline"
              data-testid="admin-product-images"
              render={
                <Link
                  to="/catalog/products/$productId/images"
                  params={{ productId: data.id }}
                />
              }
            >
              <Images data-icon="inline-start" />
              Images
            </Button>
            <Button
              data-testid="admin-product-stock"
              render={
                <Link
                  to="/catalog/products/$productId/stock"
                  params={{ productId: data.id }}
                />
              }
            >
              <PackageOpen data-icon="inline-start" />
              Update stock
            </Button>
            <Button
              variant="outline"
              data-testid="admin-product-toggle-active"
              disabled={togglingStatus}
              onClick={toggleActive}
            >
              <Power data-icon="inline-start" />
              {isActive ? "Deactivate" : "Activate"}
            </Button>
            <Button
              data-testid="admin-product-edit"
              render={
                <Link
                  to="/catalog/products/$productId/edit"
                  params={{ productId: data.id }}
                />
              }
            >
              <Pencil data-icon="inline-start" />
              Edit
            </Button>
            {canDelete ? (
              <Button
                className="hover:border-destructive/20 hover:bg-destructive/10 hover:text-destructive"
                data-testid="admin-product-delete"
                onClick={() => setConfirmingDelete(true)}
                variant="outline"
              >
                <Trash2 data-icon="inline-start" />
                Delete
              </Button>
            ) : null}
          </>
        }
      />

      <AlertDialog
        onOpenChange={(open) => {
          if (!open) {
            setConfirmingDelete(false);
          }
        }}
        open={confirmingDelete}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this product?</AlertDialogTitle>
            <AlertDialogDescription>
              {data.name} will be permanently removed. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={deleteMutation.isPending}
              onClick={() => deleteMutation.mutate()}
            >
              {deleteMutation.isPending ? "Deleting…" : "Delete product"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="shadow-warm">
          <CardHeader>
            <CardTitle>Pricing</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <span className="numeric font-editorial text-3xl tracking-tighter">
              {formatMoney(data.price)}
            </span>
            {off > 0 ? (
              <span className="numeric text-muted-foreground text-sm">
                MRP {formatMoney(data.mrp)} · {off}% off
              </span>
            ) : null}
          </CardContent>
        </Card>

        <Card className="shadow-warm">
          <CardHeader>
            <CardTitle>Availability</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-start gap-3">
            <StatusChip label={status.label} tint={status.tint} />
            <span className="numeric text-sm">
              {formatNumber(data.stock)} in stock
            </span>
          </CardContent>
        </Card>

        <Card className="shadow-warm">
          <CardHeader>
            <CardTitle>Tags</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {data.tags.length === 0 ? (
              <span className="text-muted-foreground text-sm">No tags</span>
            ) : (
              data.tags.map((tag) => (
                <Badge key={tag} variant="outline" className="rounded-full">
                  {tag}
                </Badge>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-warm">
        <CardHeader>
          <CardTitle>Variants</CardTitle>
          <CardDescription>Pack sizes and their own stock.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {data.sizes.map((size) => (
            <div
              key={size.label}
              className="flex items-center justify-between rounded-xl border px-4 py-3"
            >
              <span className="text-sm">{size.label}</span>
              <div className="flex items-center gap-6">
                <span className="numeric text-sm">
                  {formatMoney(size.price)}
                </span>
                <span className="numeric text-muted-foreground text-sm">
                  {formatNumber(size.stock)} in stock
                </span>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </>
  );
}
