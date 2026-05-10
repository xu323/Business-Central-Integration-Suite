import { type ColumnDef } from "@tanstack/react-table";
import { Plus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

import { Breadcrumb } from "@/components/Breadcrumb";
import { DataTable } from "@/components/data-table/DataTable";
import { DataTableToolbar } from "@/components/data-table/DataTableToolbar";
import { EmptyState } from "@/components/EmptyState";
import { HighRiskBadge, StatusBadge } from "@/components/StatusBadge";
import { api } from "@/lib/api";
import { cn } from "@/lib/cn";
import { formatCurrency, formatDateShort } from "@/lib/format";
import { formatError, notify } from "@/lib/notify";
import type { PurchaseRequest, RequestStatus } from "@/types";

const STATUS_OPTIONS: (RequestStatus | "All")[] = [
  "All",
  "Draft",
  "Submitted",
  "Approved",
  "Rejected",
  "Synced",
];

export function RequestListPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [requests, setRequests] = useState<PurchaseRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const status = (params.get("status") as RequestStatus | null) ?? null;
  const dept = params.get("dept") ?? "";
  const minAmount = params.get("min") ?? "";
  const maxAmount = params.get("max") ?? "";
  const highRiskOnly = params.get("hr") === "1";

  useEffect(() => {
    setLoading(true);
    api
      .listRequests({ status: status ?? undefined, q: params.get("q") ?? undefined })
      .then((data) => setRequests(data))
      .catch((e: unknown) => {
        const { code, message } = formatError(e);
        notify.error(t("notify.errorWithCode", { code, message }));
      })
      .finally(() => setLoading(false));
  }, [params, status, t]);

  const filteredByPanel = useMemo(() => {
    return requests.filter((r) => {
      if (dept && r.department !== dept) return false;
      if (minAmount && r.total_amount < Number(minAmount)) return false;
      if (maxAmount && r.total_amount > Number(maxAmount)) return false;
      if (highRiskOnly && !r.high_risk) return false;
      return true;
    });
  }, [requests, dept, minAmount, maxAmount, highRiskOnly]);

  const columns = useMemo<ColumnDef<PurchaseRequest>[]>(
    () => [
      {
        id: "number",
        header: t("requestList.columns.number"),
        accessorKey: "number",
        cell: (info) => (
          <span className="font-mono text-xs text-neutral-160">{info.getValue<string>()}</span>
        ),
        enableHiding: false,
        size: 160,
      },
      {
        id: "description",
        header: t("requestList.columns.description"),
        accessorKey: "description",
        cell: (info) => (
          <span className="text-neutral-190">{info.getValue<string>() || "—"}</span>
        ),
      },
      {
        id: "vendor",
        header: t("requestList.columns.vendor"),
        accessorFn: (r) => r.vendor_name || r.vendor_no || "",
        cell: (info) => (
          <span className="text-neutral-130">{info.getValue<string>() || "—"}</span>
        ),
      },
      {
        id: "department",
        header: t("filters.department"),
        accessorKey: "department",
        cell: (info) => (
          <span className="text-neutral-130 text-xs">{info.getValue<string>() || "—"}</span>
        ),
      },
      {
        id: "total_amount",
        header: t("requestList.columns.amount"),
        accessorKey: "total_amount",
        cell: (info) => (
          <span className="font-medium tabular-nums">
            {formatCurrency(info.getValue<number>(), info.row.original.currency_code)}
          </span>
        ),
        meta: { align: "right" },
      },
      {
        id: "status",
        header: t("requestList.columns.status"),
        accessorKey: "status",
        cell: (info) => <StatusBadge status={info.getValue<RequestStatus>()} />,
      },
      {
        id: "high_risk",
        header: t("requestList.columns.risk"),
        accessorKey: "high_risk",
        cell: (info) => <HighRiskBadge value={info.getValue<boolean>()} />,
        sortingFn: (a, b) =>
          Number(a.original.high_risk) - Number(b.original.high_risk),
      },
      {
        id: "created_at",
        header: t("requestList.columns.created"),
        accessorKey: "created_at",
        cell: (info) => (
          <span className="text-xs text-neutral-130 font-mono">
            {formatDateShort(info.getValue<string>())}
          </span>
        ),
      },
    ],
    [t],
  );

  const exportColumns = useMemo(
    () => [
      { header: t("requestList.columns.number"), accessor: (r: PurchaseRequest) => r.number },
      { header: t("requestList.columns.description"), accessor: (r: PurchaseRequest) => r.description },
      { header: t("requestList.columns.vendor"), accessor: (r: PurchaseRequest) => r.vendor_name || r.vendor_no },
      { header: t("filters.department"), accessor: (r: PurchaseRequest) => r.department },
      { header: t("requestList.columns.amount"), accessor: (r: PurchaseRequest) => r.total_amount },
      { header: t("requestList.columns.status"), accessor: (r: PurchaseRequest) => t(`status.${r.status}`) },
      { header: t("requestList.columns.risk"), accessor: (r: PurchaseRequest) => (r.high_risk ? t("highRisk.tag") : "") },
      { header: t("requestList.columns.created"), accessor: (r: PurchaseRequest) => r.created_at },
    ],
    [t],
  );

  const setParam = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
  };

  return (
    <div className="space-y-4">
      <Breadcrumb
        items={[
          { label: t("breadcrumb.dashboard"), to: "/" },
          { label: t("breadcrumb.requests") },
        ]}
      />

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-xl font-semibold text-neutral-190">
            {t("requestList.title")}
          </h2>
          <p className="text-sm text-neutral-130 mt-1">
            {t("requestList.summary", {
              count: filteredByPanel.length,
              amount: formatCurrency(
                filteredByPanel.reduce((acc, r) => acc + r.total_amount, 0),
              ),
            })}
          </p>
        </div>
        <Link to="/requests/new" className="btn-primary">
          <Plus size={14} strokeWidth={1.75} />
          {t("requestList.newRequest")}
        </Link>
      </div>

      {/* Status pills (always-visible filter) */}
      <div className="flex gap-1 flex-wrap" data-no-print="true">
        {STATUS_OPTIONS.map((s) => {
          const active = (s === "All" && !status) || s === status;
          const label = s === "All" ? t("status.all") : t(`status.${s}`);
          return (
            <button
              key={s}
              type="button"
              onClick={() => setParam("status", s === "All" ? "" : s)}
              className={cn(
                "text-xs px-3 py-1.5 rounded border transition-colors",
                active
                  ? "bg-brand-500 text-white border-brand-500"
                  : "bg-white border-neutral-40 text-neutral-130 hover:border-brand-400 hover:text-neutral-190",
              )}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Advanced filters */}
      {filtersOpen && (
        <div className="card p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3" data-no-print="true">
          <div>
            <label className="label">{t("filters.department")}</label>
            <input
              className="input"
              value={dept}
              onChange={(e) => setParam("dept", e.target.value)}
              placeholder="—"
            />
          </div>
          <div>
            <label className="label">{t("filters.amountMin")}</label>
            <input
              className="input text-right"
              type="number"
              value={minAmount}
              onChange={(e) => setParam("min", e.target.value)}
              placeholder="0"
            />
          </div>
          <div>
            <label className="label">{t("filters.amountMax")}</label>
            <input
              className="input text-right"
              type="number"
              value={maxAmount}
              onChange={(e) => setParam("max", e.target.value)}
              placeholder="∞"
            />
          </div>
          <label className="flex items-end gap-2 mb-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={highRiskOnly}
              onChange={(e) => setParam("hr", e.target.checked ? "1" : "")}
              className="w-4 h-4 accent-brand-500"
            />
            <span className="text-sm text-neutral-160">{t("filters.highRiskOnly")}</span>
          </label>
        </div>
      )}

      <DataTable
        data={filteredByPanel}
        columns={columns}
        loading={loading}
        storageKey="requestList"
        onRowClick={(r) => navigate(`/requests/${r.id}`)}
        toolbar={(table) => (
          <DataTableToolbar
            table={table}
            searchPlaceholder={t("requestList.searchPlaceholder")}
            filtersOpen={filtersOpen}
            onToggleFilters={() => setFiltersOpen((v) => !v)}
            exportConfig={{
              filename: `purchase-requests-${new Date().toISOString().slice(0, 10)}`,
              columns: exportColumns,
              title: t("requestList.title"),
              subtitle: `${filteredByPanel.length} rows · ${new Date().toISOString().slice(0, 10)}`,
            }}
          />
        )}
        bulkActions={(selected) => (
          <button
            type="button"
            className="btn-secondary"
            onClick={() => {
              notify.info(t("bulk.exportSelected"), {
                description: `${selected.length} ${t("requestList.summary", { count: selected.length, amount: "" }).split("·")[0].trim()}`,
              });
            }}
          >
            {t("bulk.exportSelected")} · {selected.length}
          </button>
        )}
        emptyState={
          <EmptyState
            title={t("requestList.empty.title")}
            description={t("requestList.empty.description")}
            action={
              <Link to="/requests/new" className="btn-primary">
                <Plus size={14} strokeWidth={1.75} />
                {t("requestList.empty.cta")}
              </Link>
            }
          />
        }
      />
    </div>
  );
}
