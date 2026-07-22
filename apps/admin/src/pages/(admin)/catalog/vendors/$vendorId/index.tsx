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
import { Button } from "@mumzo/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@mumzo/ui/components/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@mumzo/ui/components/empty";
import { Skeleton } from "@mumzo/ui/components/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@mumzo/ui/components/table";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { queryKeys } from "@/core/api/query-keys";
import ComingSoon from "@/core/components/coming-soon";
import { formatMoney } from "@/core/components/format";
import PageHeader from "@/core/components/page-header";
import StatusChip from "@/core/components/status-chip";
import { listProducts, PRODUCT_STATUS_META } from "@/modules/catalog/products";
import {
  deleteVendor,
  getVendor,
  VENDOR_TYPE_META,
} from "@/modules/catalog/vendors";
import { usePermission } from "@/modules/roles";

export const Route = createFileRoute("/(admin)/catalog/vendors/$vendorId/")({
  component: VendorDetailPage,
});

function VendorDetailPage() {
  const { vendorId } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const canWrite = usePermission("vendor", "update");
  const canDelete = usePermission("vendor", "delete");
  const [confirmDelete, setConfirmDelete] = useState(false);

  const {
    data: vendor,
    isLoading,
    error,
  } = useQuery({
    queryKey: queryKeys.vendors.detail(vendorId),
    queryFn: () => getVendor(vendorId),
  });

  const products = useQuery({
    queryKey: [...queryKeys.products.lists(), "byVendor", vendorId],
    queryFn: () => listProducts({ vendorId, page: 1, limit: 50 }),
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteVendor(vendorId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.vendors.all });
      toast.success("Vendor deleted.");
      navigate({ to: "/catalog/vendors" });
    },
    onError: (mutationError: Error) => {
      // The server refuses when products still reference the vendor.
      toast.error(mutationError.message || "Could not delete the vendor.");
      setConfirmDelete(false);
    },
  });

  if (isLoading) {
    return <Skeleton className="h-64 rounded-2xl" />;
  }

  if (error || !vendor) {
    return (
      <PageHeader
        title="Vendor not found"
        description="This vendor doesn't exist or was removed."
      />
    );
  }

  return (
    <>
      <PageHeader
        title={vendor.name}
        description={`${vendor.slug} · ${VENDOR_TYPE_META[vendor.type].label}`}
        actions={
          <>
            {canWrite ? (
              <Button
                data-testid="admin-vendor-edit"
                render={
                  <Link
                    params={{ vendorId }}
                    to="/catalog/vendors/$vendorId/edit"
                  />
                }
                variant="outline"
              >
                <Pencil data-icon="inline-start" />
                Edit
              </Button>
            ) : null}
            {canDelete ? (
              <Button
                className="hover:border-destructive/20 hover:bg-destructive/10 hover:text-destructive"
                data-testid="admin-vendor-delete"
                disabled={vendor.productCount > 0}
                onClick={() => setConfirmDelete(true)}
                title={
                  vendor.productCount > 0
                    ? "Reassign its products before deleting."
                    : undefined
                }
                variant="outline"
              >
                <Trash2 data-icon="inline-start" />
                Delete
              </Button>
            ) : null}
          </>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="shadow-warm">
          <CardHeader>
            <CardTitle>Status</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-start gap-3">
            <StatusChip
              label={vendor.isActive ? "Active" : "Inactive"}
              tint={
                vendor.isActive
                  ? "bg-sage text-ink"
                  : "bg-secondary text-muted-foreground"
              }
            />
            <span className="numeric text-muted-foreground text-sm">
              {vendor.productCount} product
              {vendor.productCount === 1 ? "" : "s"}
            </span>
          </CardContent>
        </Card>

        <Card className="shadow-warm">
          <CardHeader>
            <CardTitle>Contact</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-1 text-sm">
            <span>{vendor.contactName ?? "No contact on file"}</span>
            <span className="text-muted-foreground">{vendor.phone ?? "—"}</span>
            <span className="text-muted-foreground">{vendor.email ?? "—"}</span>
          </CardContent>
        </Card>

        <Card className="shadow-warm">
          <CardHeader>
            <CardTitle>Business details</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-1 text-sm">
            <span className="text-muted-foreground">
              GSTIN: {vendor.gstin ?? "—"}
            </span>
            <span className="text-muted-foreground">
              {vendor.address ?? "No address on file"}
            </span>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-warm">
        <CardHeader>
          <CardTitle>Products from this vendor</CardTitle>
          <CardDescription>
            Catalog entries sourced from {vendor.name}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {products.isLoading ? (
            <Skeleton className="h-32 rounded-xl" />
          ) : (products.data?.data.length ?? 0) === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyTitle>No products yet</EmptyTitle>
                <EmptyDescription>
                  Set this vendor on a product to see it here.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <div className="overflow-x-auto rounded-2xl border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(products.data?.data ?? []).map((product) => (
                    <TableRow
                      className="cursor-pointer"
                      key={product.id}
                      onClick={() =>
                        navigate({
                          to: "/catalog/products/$productId",
                          params: { productId: product.id },
                        })
                      }
                    >
                      <TableCell className="font-medium">
                        {product.name}
                        <span className="ml-2 text-muted-foreground text-xs">
                          {product.sku}
                        </span>
                      </TableCell>
                      <TableCell className="numeric">
                        {formatMoney(product.price)}
                      </TableCell>
                      <TableCell>
                        <StatusChip
                          label={PRODUCT_STATUS_META[product.status].label}
                          tint={PRODUCT_STATUS_META[product.status].tint}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-warm">
        <CardHeader>
          <CardTitle>Invoices</CardTitle>
          <CardDescription>
            Bills and payments recorded against this vendor.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ComingSoon
            description="Needs a vendor invoices/purchase-orders table and admin API — billing history isn't tracked yet."
            phase={3}
            needsApiSpec
            title="Vendor invoices"
          />
        </CardContent>
      </Card>

      <AlertDialog onOpenChange={setConfirmDelete} open={confirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this vendor?</AlertDialogTitle>
            <AlertDialogDescription>
              {vendor.name} will be removed from the directory. This cannot be
              undone.
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
              {deleteMutation.isPending ? "Deleting…" : "Delete vendor"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
