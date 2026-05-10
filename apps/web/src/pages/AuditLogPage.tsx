import { type ColumnDef } from "@tanstack/react-table";
import { FileSearch } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { Breadcrumb } from "@/components/Breadcrumb";
import { DataTable } from "@/components/data-table/DataTable";
import { DataTableToolbar } from "@/components/data-table/DataTableToolbar";
import { EmptyState } from "@/components/EmptyState";
import { SyncStatusBadge } from "@/components/StatusBadge";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { formatError, notify } from "@/lib/notify";
import type { AuditLog, SyncStatus } from "@/types";

const ACTIONS = ["create", "submit", "approve", "reject", "sync", "delete", "seed"] as const;

export function AuditLogPage() {
  const { t } = useTranslation();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState<string>("");
  const [actorFilter, setActorFilter] = useState<string>("");
  const [from, setFrom] = useState<string>("");
  const [to, setTo] = useState<string>("");

  useEffect(() => {
    api
      .listAuditLogs()
      .then((d) => setLogs(d))
      .catch((e: unknown) => {
        const { code, message } = formatError(e);
        notify.error(t("notify.errorWithCode", { code, message }));
      })
      .finally(() => setLoading(false));
  }, [t]);

  const filtered = useMemo(() => {
    return logs.filter((log) => {
      if (actionFilter && log.action !== actionFilter) return false;
      if (actorFilter && !log.actor.toLowerCase().includes(actorFilter.toLowerCase())) return false;
      if (from && new Date(log.timestamp) < new Date(from)) return false;
      if (to && new Date(log.timestamp) > new Date(`${to}T23:59:59Z`)) return false;
      return true;
    });
  }, [logs, actionFilter, actorFilter, from, to]);

  const actors = useMemo(() => {
    const set = new Set<string>();
    logs.forEach((l) => l.actor && set.add(l.actor));
    return Array.from(set).sort();
  }, [logs]);

  const columns = useMemo<ColumnDef<AuditLog>[]>(
    () => [
      {
        id: "timestamp",
        header: t("audit.columns.time"),
        accessorKey: "timestamp",
        cell: (info) => (
          <span className="text-xs text-neutral-130 font-mono">
            {formatDate(info.getValue<string>())}
          </span>
        ),
        size: 200,
      },
      {
        id: "actor",
        header: t("audit.columns.actor"),
        accessorKey: "actor",
        cell: (info) => <span className="text-sm">{info.getValue<string>()}</span>,
      },
      {
        id: "action",
        header: t("audit.columns.action"),
        accessorKey: "action",
        cell: (info) => (
          <span className="font-mono text-xs uppercase tracking-wider text-neutral-160">
            {t(`audit.action.${info.getValue<string>()}`, { defaultValue: info.getValue<string>() })}
          </span>
        ),
      },
      {
        id: "target",
        header: t("audit.columns.target"),
        accessorFn: (l) => `${l.target_type}/${l.target_id.slice(0, 8)}`,
        cell: (info) => (
          <span className="font-mono text-xs text-neutral-130">{info.getValue<string>()}</span>
        ),
      },
      {
        id: "sync_status",
        header: t("audit.columns.sync"),
        accessorKey: "sync_status",
        cell: (info) => <SyncStatusBadge status={info.getValue<SyncStatus>()} />,
      },
      {
        id: "error_message",
        header: t("audit.columns.error"),
        accessorKey: "error_message",
        cell: (info) => (
          <span className="text-xs text-danger">{info.getValue<string>() || "—"}</span>
        ),
      },
    ],
    [t],
  );

  const exportColumns = useMemo(
    () => [
      { header: t("audit.columns.time"), accessor: (l: AuditLog) => l.timestamp },
      { header: t("audit.columns.actor"), accessor: (l: AuditLog) => l.actor },
      { header: t("audit.columns.action"), accessor: (l: AuditLog) => l.action },
      { header: t("audit.columns.target"), accessor: (l: AuditLog) => `${l.target_type}/${l.target_id}` },
      { header: t("audit.columns.sync"), accessor: (l: AuditLog) => l.sync_status },
      { header: t("audit.columns.error"), accessor: (l: AuditLog) => l.error_message },
    ],
    [t],
  );

  return (
    <div className="space-y-4">
      <Breadcrumb
        items={[
          { label: t("breadcrumb.dashboard"), to: "/" },
          { label: t("breadcrumb.auditLogs") },
        ]}
      />

      <div>
        <h2 className="text-xl font-semibold text-neutral-190">{t("audit.title")}</h2>
        <p className="text-sm text-neutral-130 mt-1">{t("audit.subtitle")}</p>
      </div>

      <div className="card p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3" data-no-print="true">
        <div>
          <label className="label">{t("filters.dateFrom")}</label>
          <input type="date" className="input" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div>
          <label className="label">{t("filters.dateTo")}</label>
          <input type="date" className="input" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
        <div>
          <label className="label">{t("audit.filters.actor")}</label>
          <input
            list="audit-actors"
            className="input"
            value={actorFilter}
            onChange={(e) => setActorFilter(e.target.value)}
            placeholder="—"
          />
          <datalist id="audit-actors">
            {actors.map((a) => <option key={a} value={a} />)}
          </datalist>
        </div>
        <div>
          <label className="label">{t("audit.filters.action")}</label>
          <select
            className="input"
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
          >
            <option value="">—</option>
            {ACTIONS.map((a) => (
              <option key={a} value={a}>
                {t(`audit.action.${a}`)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <DataTable
        data={filtered}
        columns={columns}
        loading={loading}
        storageKey="auditLogs"
        toolbar={(table) => (
          <DataTableToolbar
            table={table}
            exportConfig={{
              filename: `audit-logs-${new Date().toISOString().slice(0, 10)}`,
              columns: exportColumns,
              title: t("audit.title"),
            }}
          />
        )}
        emptyState={<EmptyState title={t("audit.empty")} icon={FileSearch} />}
      />
    </div>
  );
}
