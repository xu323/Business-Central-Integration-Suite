import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { SyncStatusBadge } from "@/components/StatusBadge";
import { Spinner } from "@/components/Spinner";
import { EmptyState } from "@/components/EmptyState";
import type { AuditLog } from "@/types";

export function AuditLogPage() {
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
        <h2 className="text-xl font-semibold text-slate-800">Audit Logs</h2>
        <p className="text-sm text-slate-500 mt-1">
          Every workflow event and BC sync attempt is captured here.
        </p>
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <Spinner />
        ) : error ? (
          <div className="p-6 text-rose-700 bg-rose-50">{error}</div>
        ) : logs.length === 0 ? (
          <EmptyState title="No audit logs yet" icon="📜" />
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-600">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Time</th>
                <th className="text-left px-4 py-3 font-medium">Actor</th>
                <th className="text-left px-4 py-3 font-medium">Action</th>
                <th className="text-left px-4 py-3 font-medium">Target</th>
                <th className="text-left px-4 py-3 font-medium">Sync</th>
                <th className="text-left px-4 py-3 font-medium">Error</th>
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
