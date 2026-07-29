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
import { useState } from "react";
import { formatNumber } from "@/core/components/format";
import StatusChip from "@/core/components/status-chip";
import { hubsQueryOptions } from "@/modules/operations/hubs";
import { usePermission } from "@/modules/roles";
import { inventoryQueryOptions } from "../queries/inventory";
import { AdjustInventoryDialog } from "./adjust-inventory-dialog";

const ALL_HUBS = "all";

export function InventoryTable() {
  const [hubId, setHubId] = useState<string>(ALL_HUBS);
  const [search, setSearch] = useState("");
  const [lowStockOnly, setLowStockOnly] = useState(false);
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

  return (
    <div className="flex flex-col gap-4">
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
        <div className="flex items-center gap-2 rounded-full border px-3 py-1.5">
          <Switch
            checked={lowStockOnly}
            data-testid="inventory-low-stock-only"
            onCheckedChange={setLowStockOnly}
          />
          <span className="text-muted-foreground text-sm">Low stock only</span>
        </div>
        {canAdjust ? <AdjustInventoryDialog /> : null}
      </div>

      <div className="overflow-x-auto border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
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
                <TableCell colSpan={canAdjust ? 5 : 4}>
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
                <TableRow key={`${row.hubId}-${row.productId}`}>
                  <TableCell>
                    <div className="flex flex-col gap-0.5">
                      <span className="font-medium">{row.productName}</span>
                      <span className="numeric text-muted-foreground text-xs">
                        {row.sku}
                      </span>
                    </div>
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
