import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { EmptyState } from "@/components/EmptyState";
import { Spinner } from "@/components/Spinner";
import { SyncStatusBadge } from "@/components/StatusBadge";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/format";
import type { AuditLog } from "@/types";

export function AuditLogPage() {
  const { t } = useTranslation();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    api
      .listAuditLogs()
      .then((d) => setLogs(d))
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-slate-800">{t("audit.title")}</h2>
        <p className="text-sm text-slate-500 mt-1">{t("audit.subtitle")}</p>
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <Spinner />
        ) : error ? (
          <div className="p-6 text-rose-700 bg-rose-50">
            {t("audit.loadError", { message: error })}
          </div>
        ) : logs.length === 0 ? (
          <EmptyState title={t("audit.empty")} icon="📜" />
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-600">
              <tr>
                <th className="text-left px-4 py-3 font-medium">{t("audit.columns.time")}</th>
                <th className="text-left px-4 py-3 font-medium">{t("audit.columns.actor")}</th>
                <th className="text-left px-4 py-3 font-medium">{t("audit.columns.action")}</th>
                <th className="text-left px-4 py-3 font-medium">{t("audit.columns.target")}</th>
                <th className="text-left px-4 py-3 font-medium">{t("audit.columns.sync")}</th>
                <th className="text-left px-4 py-3 font-medium">{t("audit.columns.error")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-xs text-slate-500">{formatDate(log.timestamp)}</td>
                  <td className="px-4 py-3">{log.actor}</td>
                  <td className="px-4 py-3 font-mono text-xs">{log.action}</td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-500">
                    {log.target_type}/{log.target_id.slice(0, 8)}
                  </td>
                  <td className="px-4 py-3">
                    <SyncStatusBadge status={log.sync_status} />
                  </td>
                  <td className="px-4 py-3 text-xs text-rose-600">{log.error_message || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
