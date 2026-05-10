import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnFiltersState,
  type RowSelectionState,
  type SortingState,
  type Table as ReactTable,
  type VisibilityState,
} from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";

import { useDensity, DENSITY_HEIGHTS } from "@/lib/density";
import { cn } from "@/lib/cn";

export interface DataTableProps<TData> {
  data: TData[];
  columns: ColumnDef<TData, unknown>[];
  /** Render a toolbar above the table; gets the table instance for filter wiring. */
  toolbar?: (table: ReactTable<TData>) => ReactNode;
  /** Render selection actions when rows are selected. */
  bulkActions?: (selected: TData[]) => ReactNode;
  /** Render an empty state when no rows are visible. */
  emptyState?: ReactNode;
  loading?: boolean;
  /** Per-row click handler (e.g. navigate to detail page). */
  onRowClick?: (row: TData) => void;
  /** Stable id used for column-visibility/saved-views localStorage. */
  storageKey?: string;
  initialPageSize?: number;
}

export function DataTable<TData>({
  data,
  columns,
  toolbar,
  bulkActions,
  emptyState,
  loading,
  onRowClick,
  storageKey,
  initialPageSize = 25,
}: DataTableProps<TData>) {
  const [density] = useDensity();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [globalFilter, setGlobalFilter] = useState("");
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(() => {
    if (!storageKey || typeof window === "undefined") return {};
    const raw = window.localStorage.getItem(`bcsuite.cols.${storageKey}`);
    return raw ? (JSON.parse(raw) as VisibilityState) : {};
  });

  const table = useReactTable({
    data,
    columns,
    state: { sorting, columnFilters, rowSelection, globalFilter, columnVisibility },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalFilter,
    onColumnVisibilityChange: (updater) => {
      setColumnVisibility((prev) => {
        const next = typeof updater === "function" ? updater(prev) : updater;
        if (storageKey && typeof window !== "undefined") {
          window.localStorage.setItem(`bcsuite.cols.${storageKey}`, JSON.stringify(next));
        }
        return next;
      });
    },
    enableRowSelection: !!bulkActions,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: initialPageSize } },
  });

  const selected = useMemo(
    () => table.getSelectedRowModel().rows.map((r) => r.original),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [rowSelection, data],
  );

  const rowHeightClass = DENSITY_HEIGHTS[density];

  return (
    <div className="space-y-3">
      {toolbar && <div data-no-print="true">{toolbar(table)}</div>}

      {selected.length > 0 && bulkActions && (
        <div className="flex items-center justify-between gap-3 px-3 py-2 rounded border border-brand-200 bg-brand-50 text-sm">
          <span className="font-semibold text-brand-700">
            已選取 {selected.length} 筆
          </span>
          <div className="flex items-center gap-2">{bulkActions(selected)}</div>
        </div>
      )}

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-neutral-10 text-neutral-130 text-xs font-semibold border-b border-neutral-30">
              {table.getHeaderGroups().map((hg) => (
                <tr key={hg.id}>
                  {hg.headers.map((header) => {
                    const canSort = header.column.getCanSort();
                    const sorted = header.column.getIsSorted();
                    return (
                      <th
                        key={header.id}
                        className="px-3 py-2 text-left font-semibold whitespace-nowrap"
                        style={{ width: header.getSize() === 150 ? undefined : header.getSize() }}
                      >
                        {header.isPlaceholder ? null : canSort ? (
                          <button
                            type="button"
                            className="inline-flex items-center gap-1 hover:text-neutral-190"
                            onClick={header.column.getToggleSortingHandler()}
                          >
                            {flexRender(header.column.columnDef.header, header.getContext())}
                            {sorted === "asc" ? (
                              <ArrowUp size={12} strokeWidth={2} />
                            ) : sorted === "desc" ? (
                              <ArrowDown size={12} strokeWidth={2} />
                            ) : (
                              <ArrowUpDown size={12} strokeWidth={1.75} className="text-neutral-90" />
                            )}
                          </button>
                        ) : (
                          flexRender(header.column.columnDef.header, header.getContext())
                        )}
                      </th>
                    );
                  })}
                </tr>
              ))}
            </thead>
            <tbody className="divide-y divide-neutral-20">
              {loading
                ? Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i}>
                      {table.getVisibleLeafColumns().map((col) => (
                        <td key={col.id} className={cn("px-3", rowHeightClass)}>
                          <span className="block h-3 w-3/4 rounded bg-neutral-20 animate-pulse" />
                        </td>
                      ))}
                    </tr>
                  ))
                : table.getRowModel().rows.length === 0
                  ? null
                  : table.getRowModel().rows.map((row) => (
                      <tr
                        key={row.id}
                        className={cn(
                          rowHeightClass,
                          "hover:bg-neutral-10 transition-colors",
                          onRowClick && "cursor-pointer",
                          row.getIsSelected() && "bg-brand-50/60",
                        )}
                        onClick={(e) => {
                          // Avoid firing when clicking checkbox / interactive element.
                          if (
                            (e.target as HTMLElement).closest(
                              'button, a, input, label, [role="button"]',
                            )
                          ) {
                            return;
                          }
                          onRowClick?.(row.original);
                        }}
                      >
                        {row.getVisibleCells().map((cell) => (
                          <td
                            key={cell.id}
                            className="px-3 align-middle whitespace-nowrap text-neutral-190"
                          >
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </td>
                        ))}
                      </tr>
                    ))}
            </tbody>
          </table>
        </div>

        {!loading && table.getRowModel().rows.length === 0 && emptyState && (
          <div className="border-t border-neutral-30">{emptyState}</div>
        )}
      </div>

      {/* Pagination footer */}
      {table.getPageCount() > 1 && (
        <DataTablePagination table={table} />
      )}
    </div>
  );
}

interface PagProps<T> {
  table: ReactTable<T>;
}

function DataTablePagination<T>({ table }: PagProps<T>) {
  const { pageIndex, pageSize } = table.getState().pagination;
  const total = table.getFilteredRowModel().rows.length;
  const start = total === 0 ? 0 : pageIndex * pageSize + 1;
  const end = Math.min(total, (pageIndex + 1) * pageSize);

  return (
    <div className="flex items-center justify-between text-xs text-neutral-130 px-1">
      <div>
        {start}–{end} / {total}
      </div>
      <div className="flex items-center gap-2">
        <select
          className="input h-7 w-auto text-xs"
          value={pageSize}
          onChange={(e) => table.setPageSize(Number(e.target.value))}
        >
          {[10, 25, 50, 100].map((n) => (
            <option key={n} value={n}>
              {n}/頁
            </option>
          ))}
        </select>
        <button
          type="button"
          className="btn-subtle h-7 px-2"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          ‹
        </button>
        <span>
          {pageIndex + 1} / {table.getPageCount()}
        </span>
        <button
          type="button"
          className="btn-subtle h-7 px-2"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          ›
        </button>
      </div>
    </div>
  );
}
