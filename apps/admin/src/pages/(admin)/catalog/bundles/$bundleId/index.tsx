import { bundleItemsTotal, bundleSavings } from "@mumzo/schema";
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
import { formatMoney } from "@/core/components/format";
import PageHeader from "@/core/components/page-header";
import StatusChip from "@/core/components/status-chip";
import {
  BUNDLE_STATUS_META,
  deleteBundle,
  getBundle,
} from "@/modules/operations/bundles";
import { usePermission } from "@/modules/roles";

export const Route = createFileRoute("/(admin)/catalog/bundles/$bundleId/")({
  component: BundleDetailPage,
});

function BundleDetailPage() {
  const { bundleId } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const canWrite = usePermission("bundle", "update");
  const canDelete = usePermission("bundle", "delete");
  const [confirmDelete, setConfirmDelete] = useState(false);

  const {
    data: bundle,
    isLoading,
    error,
  } = useQuery({
    queryKey: queryKeys.bundles.detail(bundleId),
    queryFn: () => getBundle(bundleId),
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteBundle(bundleId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.bundles.all });
      toast.success("Bundle deleted.");
      navigate({ to: "/catalog/bundles" });
    },
    onError: (mutationError: Error) => {
      toast.error(mutationError.message || "Could not delete the bundle.");
      setConfirmDelete(false);
    },
  });

  if (isLoading) {
    return <Skeleton className="h-64 rounded-2xl" />;
  }

  if (error || !bundle) {
    return (
      <PageHeader
        description="This bundle doesn't exist or was removed."
        title="Bundle not found"
      />
    );
  }

  const meta = BUNDLE_STATUS_META[bundle.status];
  const itemsTotal = bundleItemsTotal(bundle.items);
  const savings = bundleSavings(bundle, bundle.items);

  return (
    <>
      <PageHeader
        actions={
          <>
            {canWrite ? (
              <Button
                data-testid="admin-bundle-edit"
                render={
                  <Link
                    params={{ bundleId }}
                    to="/catalog/bundles/$bundleId/edit"
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
                data-testid="admin-bundle-delete"
                onClick={() => setConfirmDelete(true)}
                variant="outline"
              >
                <Trash2 data-icon="inline-start" />
                Delete
              </Button>
            ) : null}
          </>
        }
        description={bundle.slug}
        title={bundle.name}
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="shadow-warm">
          <CardHeader>
            <CardTitle>Status</CardTitle>
          </CardHeader>
          <CardContent>
            <StatusChip label={meta.label} tint={meta.tint} />
          </CardContent>
        </Card>

        <Card className="shadow-warm">
          <CardHeader>
            <CardTitle>Bundle price</CardTitle>
          </CardHeader>
          <CardContent>
            <span className="numeric font-editorial text-2xl">
              {formatMoney(bundle.price)}
            </span>
          </CardContent>
        </Card>

        <Card className="shadow-warm">
          <CardHeader>
            <CardTitle>Savings</CardTitle>
          </CardHeader>
          <CardContent>
            <span className="numeric text-sm">
              Items total {formatMoney(itemsTotal)} —{" "}
              {savings >= 0
                ? `saves ${formatMoney(savings)}`
                : `priced ${formatMoney(Math.abs(savings))} above items`}
            </span>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-warm">
        <CardHeader>
          <CardTitle>Products in this bundle</CardTitle>
          <CardDescription>
            {bundle.description ?? "No description."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-2xl border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Price each</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bundle.items.map((item) => (
                  <TableRow
                    className="cursor-pointer"
                    key={item.productId}
                    onClick={() =>
                      navigate({
                        to: "/catalog/products/$productId",
                        params: { productId: item.productId },
                      })
                    }
                  >
                    <TableCell className="font-medium">
                      {item.productName}
                    </TableCell>
                    <TableCell className="numeric">{item.quantity}</TableCell>
                    <TableCell className="numeric">
                      {formatMoney(item.productPrice)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <AlertDialog onOpenChange={setConfirmDelete} open={confirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this bundle?</AlertDialogTitle>
            <AlertDialogDescription>
              {bundle.name} will be removed. This cannot be undone.
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
              {deleteMutation.isPending ? "Deleting…" : "Delete bundle"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
