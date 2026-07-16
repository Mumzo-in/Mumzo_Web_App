import { Button } from "@mumzo/ui/components/button";
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
import { cn } from "@mumzo/ui/lib/utils";
import { flexRender, type Table as TanstackTable } from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight } from "lucide-react";
import type { PageMeta } from "@/core/api/client";

type DataTableProps<T> = {
  table: TanstackTable<T>;
  meta?: PageMeta;
  isLoading: boolean;
  isFetching?: boolean;
  error?: unknown;
  hasNext: boolean;
  hasPrev: boolean;
  onPageChange: (next: number) => void;
  page: number;
  emptyTitle?: string;
  emptyDescription?: string;
  /** Row click → detail navigation. */
  onRowClick?: (row: T) => void;
  testId?: string;
};

/**
 * Renders any `usePaginatedList` result. Sorting is server-side, so headers
 * toggle the query rather than re-sorting rows in place.
 */
export function DataTable<T>({
  table,
  meta,
  isLoading,
  isFetching = false,
  error,
  hasNext,
  hasPrev,
  onPageChange,
  page,
  emptyTitle = "Nothing here yet",
  emptyDescription = "No records match this view.",
  onRowClick,
  testId = "admin-data-table",
}: DataTableProps<T>) {
  const columnCount = table.getAllColumns().length;

  if (error) {
    const message =
      error instanceof Error ? error.message : "Something went wrong.";
    return (
      <Empty data-testid={`${testId}-error`}>
        <EmptyHeader>
          <EmptyTitle>Couldn't load this list</EmptyTitle>
          <EmptyDescription>{message}</EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <div className="flex flex-col gap-4" data-testid={testId}>
      <div className="overflow-x-auto rounded-2xl border bg-card">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const canSort = header.column.getCanSort();
                  const sorted = header.column.getIsSorted();
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder ? null : canSort ? (
                        <button
                          type="button"
                          className="inline-flex items-center gap-1 transition-colors hover:text-foreground"
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                          {sorted === "asc" ? (
                            <ArrowUp className="size-3" />
                          ) : null}
                          {sorted === "desc" ? (
                            <ArrowDown className="size-3" />
                          ) : null}
                        </button>
                      ) : (
                        flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )
                      )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>

          <TableBody>
            {isLoading ? (
              SKELETON_ROWS.map((rowKey) => (
                <TableRow key={rowKey}>
                  {table.getAllColumns().map((column) => (
                    <TableCell key={column.id}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columnCount}>
                  <Empty>
                    <EmptyHeader>
                      <EmptyTitle>{emptyTitle}</EmptyTitle>
                      <EmptyDescription>{emptyDescription}</EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className={cn(
                    isFetching && "opacity-60",
                    onRowClick && "cursor-pointer",
                  )}
                  onClick={
                    onRowClick ? () => onRowClick(row.original) : undefined
                  }
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between gap-4">
        <p className="text-muted-foreground text-sm">
          {meta ? (
            <>
              Page {meta.page} · {meta.total} total
            </>
          ) : null}
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={!hasPrev}
            onClick={() => onPageChange(page - 1)}
            data-testid={`${testId}-prev`}
          >
            <ChevronLeft data-icon="inline-start" />
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={!hasNext}
            onClick={() => onPageChange(page + 1)}
            data-testid={`${testId}-next`}
          >
            Next
            <ChevronRight data-icon="inline-end" />
          </Button>
        </div>
      </div>
    </div>
  );
}

/** Stable keys — index-as-key is banned (AGENTS.md §6). */
const SKELETON_ROWS = [
  "sk-1",
  "sk-2",
  "sk-3",
  "sk-4",
  "sk-5",
  "sk-6",
  "sk-7",
  "sk-8",
] as const;

export default DataTable;
