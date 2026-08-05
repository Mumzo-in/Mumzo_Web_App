import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@mumzo/ui/components/empty";
import { Input } from "@mumzo/ui/components/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@mumzo/ui/components/select";
import { Skeleton } from "@mumzo/ui/components/skeleton";
import { Switch } from "@mumzo/ui/components/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@mumzo/ui/components/table";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, Boxes, PackageX } from "lucide-react";
import { useMemo, useState } from "react";
import { formatNumber } from "@/core/components/format";
import StatusChip from "@/core/components/status-chip";
import { hubsQueryOptions } from "@/modules/hub";
import { usePermission } from "@/modules/roles";
import type { InventoryRow } from "../api/inventory-api";
import { inventoryQueryOptions } from "../queries/inventory";
import { AdjustInventoryDialog } from "./adjust-inventory-dialog";

const ALL_HUBS = "all";

type InventoryStat = {
  key: string;
  label: string;
  value: number;
  icon: typeof Boxes;
  tint: string;
};

function summarize(rows: InventoryRow[]): InventoryStat[] {
  const outOfStock = rows.filter((row) => row.stock === 0).length;
  const lowStock = rows.filter((row) => row.stock > 0 && row.isLowStock).length;
  return [
    {
      key: "tracked",
      label: "Tracked lines",
      value: rows.length,
      icon: Boxes,
      tint: "bg-secondary text-foreground",
    },
    {
      key: "low",
      label: "Low stock",
      value: lowStock,
      icon: AlertTriangle,
      tint: "bg-accent text-accent-foreground",
    },
    {
      key: "out",
      label: "Out of stock",
      value: outOfStock,
      icon: PackageX,
      tint: "bg-destructive/10 text-destructive",
    },
  ];
}

type InventoryTableProps = {
  /** Pre-applies the "low stock only" filter — used when the page is
   * reached via `?stock=low` (e.g. the dashboard's attention link). */
  defaultLowStockOnly?: boolean;
};

export function InventoryTable({
  defaultLowStockOnly = false,
}: InventoryTableProps) {
  const [hubId, setHubId] = useState<string>(ALL_HUBS);
  const [search, setSearch] = useState("");
  const [lowStockOnly, setLowStockOnly] = useState(defaultLowStockOnly);
  const canAdjust = usePermission("inventory", "adjust");

  const hubs = useQuery(hubsQueryOptions);
  const { data, isLoading, error } = useQuery(
    inventoryQueryOptions({
      hubId: hubId === ALL_HUBS ? undefined : hubId,
      search: search || undefined,
      lowStockOnly: lowStockOnly || undefined,
    }),
  );

  if (error) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyTitle>Failed to load inventory</EmptyTitle>
          <EmptyDescription>
            {error instanceof Error ? error.message : "Something went wrong."}
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  const rows = data ?? [];
  const stats = useMemo(() => summarize(rows), [rows]);

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-3 sm:grid-cols-3">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              className="flex items-center gap-3 rounded-3xl border border-border bg-card p-4 shadow-warm"
              key={stat.key}
            >
              <div
                className={`flex size-10 shrink-0 items-center justify-center rounded-full ${stat.tint}`}
              >
                <Icon aria-hidden="true" className="size-4.5" />
              </div>
              <div className="flex flex-col">
                <span className="numeric font-editorial text-2xl tracking-tighter">
                  {isLoading ? (
                    <Skeleton className="h-7 w-10" />
                  ) : (
                    formatNumber(stat.value)
                  )}
                </span>
                <span className="text-muted-foreground text-xs">
                  {stat.label}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Input
          className="max-w-xs"
          data-testid="inventory-search"
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search product or SKU…"
          value={search}
        />
        <Select
          onValueChange={(value) => setHubId(value ?? ALL_HUBS)}
          value={hubId}
        >
          <SelectTrigger className="w-56" data-testid="inventory-hub-filter">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value={ALL_HUBS}>All hubs</SelectItem>
              {(hubs.data ?? []).map((hub) => (
                <SelectItem key={hub.id} value={hub.id}>
                  {hub.name}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
        <div className="flex items-center gap-2 rounded-full border border-border px-3 py-1.5">
          <Switch
            checked={lowStockOnly}
            data-testid="inventory-low-stock-only"
            onCheckedChange={setLowStockOnly}
          />
          <span className="text-muted-foreground text-sm">Low stock only</span>
        </div>
        {canAdjust ? <AdjustInventoryDialog /> : null}
      </div>

      <div className="overflow-x-auto rounded-3xl border border-border bg-card shadow-warm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>Variant</TableHead>
              <TableHead>Hub</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead>Reorder point</TableHead>
              {canAdjust ? (
                <TableHead className="text-right">Actions</TableHead>
              ) : null}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <TableRow key={`ske-${i.toString()}`}>
                  <TableCell>
                    <Skeleton className="h-4 w-40" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-20" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-28" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-16" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-12" />
                  </TableCell>
                  {canAdjust ? (
                    <TableCell className="text-right">
                      <Skeleton className="ml-auto h-8 w-20 rounded-lg" />
                    </TableCell>
                  ) : null}
                </TableRow>
              ))
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={canAdjust ? 6 : 5}>
                  <Empty>
                    <EmptyHeader>
                      <EmptyTitle>No stock recorded</EmptyTitle>
                      <EmptyDescription>
                        Adjust stock for a hub to start tracking it here.
                      </EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>
                    <div className="flex flex-col gap-0.5">
                      <span className="font-medium">{row.productName}</span>
                      <span className="numeric text-muted-foreground text-xs">
                        {row.sku}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {row.variantLabel ?? "—"}
                  </TableCell>
                  <TableCell>{row.hubName}</TableCell>
                  <TableCell>
                    {row.stock === 0 ? (
                      <StatusChip
                        label="Out of stock"
                        tint="bg-destructive/10 text-destructive"
                      />
                    ) : row.isLowStock ? (
                      <StatusChip
                        label={`Low · ${formatNumber(row.stock)}`}
                        tint="bg-accent text-accent-foreground"
                      />
                    ) : (
                      <span className="numeric">{formatNumber(row.stock)}</span>
                    )}
                  </TableCell>
                  <TableCell className="numeric text-muted-foreground">
                    {formatNumber(row.reorderPoint)}
                  </TableCell>
                  {canAdjust ? (
                    <TableCell className="text-right">
                      <AdjustInventoryDialog row={row} />
                    </TableCell>
                  ) : null}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

export default InventoryTable;
