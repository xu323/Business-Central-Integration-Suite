import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "@/lib/api";
import { formatCurrency, formatDate } from "@/lib/format";
import { HighRiskBadge, StatusBadge } from "@/components/StatusBadge";
import { Spinner } from "@/components/Spinner";
import { EmptyState } from "@/components/EmptyState";
import type { PurchaseRequest, RequestStatus } from "@/types";

const STATUSES: (RequestStatus | "All")[] = [
  "All",
  "Draft",
  "Submitted",
  "Approved",
  "Rejected",
  "Synced",
];

export function RequestListPage() {
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
          <h2 className="text-xl font-semibold text-slate-800">Purchase Requests</h2>
          <p className="text-sm text-slate-500 mt-1">
            {requests.length} requests · total {formatCurrency(total)}
          </p>
        </div>
        <Link to="/requests/new" className="btn-primary">
          ➕ New Request
        </Link>
      </div>

      <div className="card p-4 flex flex-wrap gap-3 items-end">
        <div className="flex-1 min-w-[200px]">
          <label className="label">Search</label>
          <form onSubmit={onSearch}>
            <input
              className="input"
              placeholder="Description / vendor / requester"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </form>
        </div>
        <div>
          <label className="label">Status</label>
          <div className="flex gap-1 flex-wrap">
            {STATUSES.map((s) => {
              const active = (s === "All" && !status) || s === status;
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
                  {s}
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
          <div className="p-6 text-rose-700 bg-rose-50">{error}</div>
        ) : requests.length === 0 ? (
          <EmptyState
            title="No requests yet"
            description="Create your first purchase request to start the approval workflow."
            action={
              <Link to="/requests/new" className="btn-primary">
                ➕ Create Request
              </Link>
            }
          />
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wide">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Number</th>
                <th className="text-left px-4 py-3 font-medium">Description</th>
                <th className="text-left px-4 py-3 font-medium">Vendor</th>
                <th className="text-right px-4 py-3 font-medium">Amount</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
                <th className="text-left px-4 py-3 font-medium">Risk</th>
                <th className="text-left px-4 py-3 font-medium">Created</th>
                <th className="text-right px-4 py-3 font-medium">Actions</th>
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
                  <td className="px-4 py-3 text-slate-500 text-xs">
                    {formatDate(r.created_at)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      to={`/requests/${r.id}`}
                      className="text-brand-600 hover:underline text-sm"
                    >
                      View →
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
