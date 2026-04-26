import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

import { Spinner } from "@/components/Spinner";
import { api } from "@/lib/api";
import { formatCurrency } from "@/lib/format";
import type { DashboardSummary, RequestStatus } from "@/types";

const STATUS_ORDER: RequestStatus[] = [
  "Draft",
  "Submitted",
  "Approved",
  "Rejected",
  "Synced",
];

export function DashboardPage() {
  const { t } = useTranslation();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    api
      .dashboardSummary()
      .then((s) => setSummary(s))
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;
  if (error) {
    return (
      <div className="card p-6 border-rose-200 bg-rose-50 text-rose-700">
        {t("dashboard.loadFailed", { message: error })}
      </div>
    );
  }
  if (!summary) return null;

  const stats = [
    {
      label: t("dashboard.totalRequests"),
      value: summary.total_requests.toLocaleString(),
      tone: "text-slate-800",
    },
    {
      label: t("dashboard.highRiskApprovals"),
      value: summary.high_risk_count.toLocaleString(),
      tone: summary.high_risk_count > 0 ? "text-rose-600" : "text-slate-800",
    },
    {
      label: t("dashboard.openAmount"),
      value: formatCurrency(summary.total_amount_open),
      tone: "text-amber-600",
    },
    {
      label: t("dashboard.syncedAmount"),
      value: formatCurrency(summary.total_amount_synced),
      tone: "text-emerald-600",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-800">{t("dashboard.title")}</h2>
          <p className="text-sm text-slate-500 mt-1">{t("dashboard.subtitle")}</p>
        </div>
        <Link to="/requests/new" className="btn-primary">
          {t("dashboard.newRequest")}
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="card p-5">
            <div className="text-xs uppercase tracking-wide text-slate-500">{s.label}</div>
            <div className={`mt-2 text-2xl font-semibold ${s.tone}`}>{s.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-700">{t("dashboard.byStatus")}</h3>
            <Link to="/requests" className="text-xs text-brand-600 hover:underline">
              {t("common.viewAllArrow")}
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {STATUS_ORDER.map((s) => (
              <Link
                key={s}
                to={`/requests?status=${s}`}
                className="rounded-lg border border-slate-200 hover:border-brand-400 hover:bg-brand-50 p-3 text-center transition-colors"
              >
                <div className="text-xs uppercase tracking-wide text-slate-500">
                  {t(`status.${s}`)}
                </div>
                <div className="mt-1 text-xl font-semibold text-slate-800">
                  {summary.by_status[s] ?? 0}
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="card p-5">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">
            {t("dashboard.syncHealth")}
          </h3>
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-slate-600">{t("dashboard.recentFailures")}</span>
              <span
                className={`font-semibold ${
                  summary.recent_sync_failures > 0 ? "text-rose-600" : "text-emerald-600"
                }`}
              >
                {summary.recent_sync_failures}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600">{t("dashboard.syncedDocuments")}</span>
              <span className="font-semibold text-slate-800">
                {summary.by_status["Synced"] ?? 0}
              </span>
            </div>
            <Link to="/audit" className="block mt-2 text-xs text-brand-600 hover:underline">
              {t("dashboard.viewAuditLogs")}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
