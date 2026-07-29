import { keepPreviousData, useQuery } from "@tanstack/react-query";
import {
  type ColumnDef,
  getCoreRowModel,
  type SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { useMemo, useState } from "react";
import type { Paginated } from "./client";
import type { ListParams } from "./query-keys";

/**
 * The shared list pattern. ~15 admin screens are "paginated table with filters
 * and sorting", so they all run through here rather than each re-deriving
 * page state, sorting, and table wiring.
 *
 * Pagination and sorting are server-side (the API owns `?page&limit`), so the
 * table is configured `manual*` — it renders what the server returned and does
 * not re-slice rows client-side.
 */

export type PaginatedListOptions<T> = {
  /** Stable prefix from `queryKeys`, e.g. `queryKeys.products.lists()`. */
  queryKey: readonly unknown[];
  /** Fetches one page. Receives merged pagination + filter params. */
  fetcher: (params: ListParams) => Promise<Paginated<T>>;
  columns: ColumnDef<T, unknown>[];
  /** Extra query params (filters, search). Changing these resets to page 1. */
  filters?: ListParams;
  initialLimit?: number;
  /**
   * Controlled page state — pass both to drive pagination from outside (e.g.
   * a URL search param) instead of the hook's own `useState`. Omit either to
   * keep the default internal state.
   */
  page?: number;
  onPageChange?: (page: number) => void;
};

export function usePaginatedList<T>({
  queryKey,
  fetcher,
  columns,
  filters,
  initialLimit = 20,
  page: controlledPage,
  onPageChange,
}: PaginatedListOptions<T>) {
  const [internalPage, setInternalPage] = useState(1);
  const [limit, setLimit] = useState(initialLimit);
  const [sorting, setSorting] = useState<SortingState>([]);

  const isControlled =
    controlledPage !== undefined && onPageChange !== undefined;
  const page = isControlled ? controlledPage : internalPage;
  const setPage = isControlled ? onPageChange : setInternalPage;

  const sort = sorting[0];
  // Serialized so the memo/query key depends on the value, not the array identity.
  const filterKey = JSON.stringify(filters ?? {});

  const params = useMemo((): ListParams => {
    const parsed = JSON.parse(filterKey) as ListParams;
    return {
      ...parsed,
      page,
      limit,
      // A column-header click (manual `sorting` state) wins over a caller-
      // supplied sort preset in `filters` — clicking a header is the more
      // specific, more recent user action.
      sortBy: sort?.id ?? parsed.sortBy,
      sortDir: sort ? (sort.desc ? "desc" : "asc") : parsed.sortDir,
    };
  }, [filterKey, page, limit, sort]);

  const query = useQuery({
    queryKey: [...queryKey, params],
    queryFn: () => fetcher(params),
    // Keeps the previous page visible while the next loads — avoids the table
    // collapsing to a spinner on every page change.
    placeholderData: keepPreviousData,
  });

  const rows = useMemo(() => query.data?.data ?? [], [query.data]);
  const meta = query.data?.meta;

  const table = useReactTable({
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    manualSorting: true,
    state: { sorting },
    onSortingChange: setSorting,
    pageCount: meta ? Math.ceil(meta.total / meta.limit) : -1,
  });

  /** Filters live in the caller; it resets the page when they change. */
  function resetToFirstPage() {
    setPage(1);
  }

  return {
    table,
    rows,
    meta,
    page,
    limit,
    setPage,
    setLimit,
    resetToFirstPage,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
    hasNext: meta?.hasNext ?? false,
    hasPrev: page > 1,
  };
}
