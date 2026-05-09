import { FileSearch } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { EmptyState } from "@/components/EmptyState";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { SyncStatusBadge } from "@/components/StatusBadge";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { formatError, notify } from "@/lib/notify";
import type { AuditLog } from "@/types";

export function AuditLogPage() {
  const { t } = useTranslation();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-neutral-190">{t("audit.title")}</h2>
        <p className="text-sm text-neutral-130 mt-1">{t("audit.subtitle")}</p>
      </div>

      {loading ? (
        <TableSkeleton rows={8} columns={6} />
      ) : (
      <div className="card overflow-hidden">
        {logs.length === 0 ? (
          <EmptyState title={t("audit.empty")} icon={FileSearch} />
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-neutral-10 text-xs font-semibold text-neutral-130">
              <tr>
                <th className="text-left px-4 py-3 font-medium">{t("audit.columns.time")}</th>
                <th className="text-left px-4 py-3 font-medium">{t("audit.columns.actor")}</th>
                <th className="text-left px-4 py-3 font-medium">{t("audit.columns.action")}</th>
                <th className="text-left px-4 py-3 font-medium">{t("audit.columns.target")}</th>
                <th className="text-left px-4 py-3 font-medium">{t("audit.columns.sync")}</th>
                <th className="text-left px-4 py-3 font-medium">{t("audit.columns.error")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-20">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-neutral-10">
                  <td className="px-4 py-3 text-xs text-neutral-130">{formatDate(log.timestamp)}</td>
                  <td className="px-4 py-3">{log.actor}</td>
                  <td className="px-4 py-3 font-mono text-xs">{log.action}</td>
                  <td className="px-4 py-3 font-mono text-xs text-neutral-130">
                    {log.target_type}/{log.target_id.slice(0, 8)}
                  </td>
                  <td className="px-4 py-3">
                    <SyncStatusBadge status={log.sync_status} />
                  </td>
                  <td className="px-4 py-3 text-xs text-danger">{log.error_message || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      )}
    </div>
  );
}
