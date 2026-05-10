import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Download, Eye, Printer, RefreshCw, Search, SlidersHorizontal, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { type Table as ReactTable } from "@tanstack/react-table";

import { DensityToggle } from "@/components/DensityToggle";
import { cn } from "@/lib/cn";
import type { ExportColumn } from "@/lib/export";
import { exportCsv, exportPdf, exportXlsx } from "@/lib/export";

export interface ToolbarExportConfig<T> {
  filename: string;
  columns: ExportColumn<T>[];
  title?: string;
  subtitle?: string;
}

interface Props<T> {
  table: ReactTable<T>;
  searchPlaceholder?: string;
  filtersOpen?: boolean;
  onToggleFilters?: () => void;
  onRefresh?: () => void;
  exportConfig?: ToolbarExportConfig<T>;
  /** Display rows currently visible (after filtering / sorting). */
  exportSource?: "all" | "filtered";
}

export function DataTableToolbar<T>({
  table,
  searchPlaceholder,
  filtersOpen,
  onToggleFilters,
  onRefresh,
  exportConfig,
  exportSource = "filtered",
}: Props<T>) {
  const { t } = useTranslation();
  const search = table.getState().globalFilter ?? "";

  const visibleColumns = table.getAllLeafColumns().filter((c) => c.getCanHide());

  const exportRows = (): T[] => {
    if (exportSource === "all") return table.getCoreRowModel().rows.map((r) => r.original);
    return table.getFilteredRowModel().rows.map((r) => r.original);
  };

  return (
    <div className="flex flex-wrap items-end gap-2" data-no-print="true">
      <div className="flex items-center flex-1 min-w-[220px] max-w-md relative">
        <Search
          size={14}
          strokeWidth={1.75}
          className="absolute left-2.5 text-neutral-90 pointer-events-none"
        />
        <input
          className="input pl-8"
          placeholder={searchPlaceholder ?? t("common.search")}
          value={search}
          onChange={(e) => table.setGlobalFilter(e.target.value)}
        />
        {search && (
          <button
            type="button"
            className="absolute right-2 text-neutral-90 hover:text-neutral-190"
            onClick={() => table.setGlobalFilter("")}
          >
            <X size={12} strokeWidth={2} />
          </button>
        )}
      </div>

      {onToggleFilters && (
        <button
          type="button"
          onClick={onToggleFilters}
          className={cn("btn-secondary", filtersOpen && "border-brand-500 text-brand-700")}
        >
          <SlidersHorizontal size={14} strokeWidth={1.75} />
          {t("table.filters")}
        </button>
      )}

      <DensityToggle />

      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <button type="button" className="btn-secondary">
            <Eye size={14} strokeWidth={1.75} />
            {t("table.columns")}
          </button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content
            align="end"
            sideOffset={6}
            className="z-50 min-w-[200px] rounded border border-neutral-40 bg-white shadow-flyout p-1.5 focus:outline-none"
          >
            <div className="px-2.5 py-1.5 text-[10px] font-semibold text-neutral-90 uppercase">
              {t("table.columnsTitle")}
            </div>
            {visibleColumns.map((column) => {
              const id = column.id;
              const headerLabel =
                typeof column.columnDef.header === "string"
                  ? (column.columnDef.header as string)
                  : id;
              return (
                <DropdownMenu.CheckboxItem
                  key={id}
                  checked={column.getIsVisible()}
                  onCheckedChange={(v) => column.toggleVisibility(!!v)}
                  className="flex items-center gap-2 rounded px-2.5 py-1.5 text-sm text-neutral-160 hover:bg-neutral-20 outline-none cursor-pointer"
                >
                  <span className="inline-flex w-4 h-4 items-center justify-center border border-neutral-60 rounded">
                    {column.getIsVisible() && (
                      <span className="w-2 h-2 bg-brand-500 rounded-sm" />
                    )}
                  </span>
                  {headerLabel}
                </DropdownMenu.CheckboxItem>
              );
            })}
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>

      {exportConfig && (
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button type="button" className="btn-secondary">
              <Download size={14} strokeWidth={1.75} />
              {t("table.export")}
            </button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content
              align="end"
              sideOffset={6}
              className="z-50 min-w-[160px] rounded border border-neutral-40 bg-white shadow-flyout p-1.5 focus:outline-none"
            >
              {(["csv", "xlsx", "pdf"] as const).map((kind) => (
                <DropdownMenu.Item
                  key={kind}
                  onSelect={() => {
                    const rows = exportRows();
                    if (kind === "csv") exportCsv(rows, exportConfig.columns, exportConfig.filename);
                    else if (kind === "xlsx") exportXlsx(rows, exportConfig.columns, exportConfig.filename);
                    else exportPdf(rows, exportConfig.columns, exportConfig.filename, {
                      title: exportConfig.title,
                      subtitle: exportConfig.subtitle,
                    });
                  }}
                  className="flex items-center gap-2 rounded px-2.5 py-1.5 text-sm text-neutral-160 hover:bg-neutral-20 outline-none cursor-pointer"
                >
                  <span className="font-mono text-[10px] uppercase tracking-wider text-neutral-90">
                    .{kind}
                  </span>
                  <span>{t(`table.exportAs.${kind}`)}</span>
                </DropdownMenu.Item>
              ))}
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      )}

      <button
        type="button"
        className="btn-secondary"
        onClick={() => window.print()}
        title={t("table.print")}
      >
        <Printer size={14} strokeWidth={1.75} />
        {t("table.print")}
      </button>

      {onRefresh && (
        <button
          type="button"
          className="btn-subtle"
          onClick={onRefresh}
          title={t("table.refresh")}
        >
          <RefreshCw size={14} strokeWidth={1.75} />
        </button>
      )}
    </div>
  );
}
