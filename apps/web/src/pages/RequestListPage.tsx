import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useSearchParams } from "react-router-dom";

import { EmptyState } from "@/components/EmptyState";
import { Spinner } from "@/components/Spinner";
import { HighRiskBadge, StatusBadge } from "@/components/StatusBadge";
import { api } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/format";
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
  const [params, setParams] = useSearchParams();
  const [requests, setRequests] = useState<PurchaseRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [query, setQuery] = useState<string>(params.get("q") ?? "");

  const status = (params.get("status") as RequestStatus | null) ?? null;

  useEffect(() => {
    setLoading(true);
    api
      .listRequests({
        status: status ?? undefined,
        q: params.get("q") ?? undefined,
      })
      .then((data) => setRequests(data))
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [params, status]);

  const total = useMemo(
    () => requests.reduce((acc, r) => acc + r.total_amount, 0),
    [requests],
  );

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const next = new URLSearchParams(params);
    if (query) next.set("q", query);
    else next.delete("q");
    setParams(next, { replace: true });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-800">{t("requestList.title")}</h2>
          <p className="text-sm text-slate-500 mt-1">
            {t("requestList.summary", {
              count: requests.length,
              amount: formatCurrency(total),
            })}
          </p>
        </div>
        <Link to="/requests/new" className="btn-primary">
          {t("requestList.newRequest")}
        </Link>
      </div>

      <div className="card p-4 flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-[200px]">
          <label className="label">{t("requestList.searchLabel")}</label>
          <form onSubmit={onSearch}>
            <input
              className="input"
              placeholder={t("requestList.searchPlaceholder")}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </form>
        </div>
        <div>
          <label className="label">{t("requestList.statusLabel")}</label>
          <div className="flex gap-1 flex-wrap">
            {STATUS_OPTIONS.map((s) => {
              const active = (s === "All" && !status) || s === status;
              const label = s === "All" ? t("status.all") : t(`status.${s}`);
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => {
                    const next = new URLSearchParams(params);
                    if (s === "All") next.delete("status");
                    else next.set("status", s);
                    setParams(next, { replace: true });
                  }}
                  className={`text-xs px-3 py-1.5 rounded-full border ${
                    active
                      ? "bg-brand-600 text-white border-brand-600"
                      : "bg-white border-slate-200 text-slate-600 hover:border-brand-400"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <Spinner />
        ) : error ? (
          <div className="p-6 text-rose-700 bg-rose-50">
            {t("requestList.loadError", { message: error })}
          </div>
        ) : requests.length === 0 ? (
          <EmptyState
            title={t("requestList.empty.title")}
            description={t("requestList.empty.description")}
            action={
              <Link to="/requests/new" className="btn-primary">
                {t("requestList.empty.cta")}
              </Link>
            }
          />
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wide">
              <tr>
                <th className="text-left px-4 py-3 font-medium">{t("requestList.columns.number")}</th>
                <th className="text-left px-4 py-3 font-medium">{t("requestList.columns.description")}</th>
                <th className="text-left px-4 py-3 font-medium">{t("requestList.columns.vendor")}</th>
                <th className="text-right px-4 py-3 font-medium">{t("requestList.columns.amount")}</th>
                <th className="text-left px-4 py-3 font-medium">{t("requestList.columns.status")}</th>
                <th className="text-left px-4 py-3 font-medium">{t("requestList.columns.risk")}</th>
                <th className="text-left px-4 py-3 font-medium">{t("requestList.columns.created")}</th>
                <th className="text-right px-4 py-3 font-medium">{t("requestList.columns.actions")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {requests.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-mono text-xs text-slate-700">{r.number}</td>
                  <td className="px-4 py-3 text-slate-800">{r.description || "—"}</td>
                  <td className="px-4 py-3 text-slate-600">{r.vendor_name || r.vendor_no || "—"}</td>
                  <td className="px-4 py-3 text-right font-medium">
                    {formatCurrency(r.total_amount, r.currency_code)}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={r.status} />
                  </td>
                  <td className="px-4 py-3">
                    <HighRiskBadge value={r.high_risk} />
                  </td>
                  <td className="px-4 py-3 text-slate-500 text-xs">{formatDate(r.created_at)}</td>
                  <td className="px-4 py-3 text-right">
                    <Link to={`/requests/${r.id}`} className="text-brand-600 hover:underline text-sm">
                      {t("requestList.rowAction")}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
