import { ArrowDown, ArrowUp, Plus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

import { Breadcrumb } from "@/components/Breadcrumb";
import { DepartmentBar } from "@/components/charts/DepartmentBar";
import { Sparkline } from "@/components/charts/Sparkline";
import { TrendChart } from "@/components/charts/TrendChart";
import { HighRiskBadge, StatusBadge } from "@/components/StatusBadge";
import { DashboardSkeleton } from "@/components/ui/Skeleton";
import { api } from "@/lib/api";
import { cn } from "@/lib/cn";
import { formatCurrency, formatDateShort, isoDay } from "@/lib/format";
import { formatError, notify } from "@/lib/notify";
import type { DashboardSummary, PurchaseRequest, RequestStatus } from "@/types";

const STATUS_ORDER: RequestStatus[] = [
  "Draft",
  "Submitted",
  "Approved",
  "Rejected",
  "Synced",
];

interface TrendPoint {
  date: string;
  count: number;
  amount: number;
}

interface DeptRow {
  department: string;
  amount: number;
}

export function DashboardPage() {
  const { t } = useTranslation();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [requests, setRequests] = useState<PurchaseRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.dashboardSummary(), api.listRequests()])
      .then(([s, list]) => {
        setSummary(s);
        setRequests(list);
      })
      .catch((e: unknown) => {
        const { code, message } = formatError(e);
        notify.error(t("notify.errorWithCode", { code, message }));
      })
      .finally(() => setLoading(false));
  }, [t]);

  // Derive 30-day trend points (count + amount per UTC day).
  const trend: TrendPoint[] = useMemo(() => {
    const buckets = new Map<string, { count: number; amount: number }>();
    const today = new Date();
    const start = new Date(today);
    start.setUTCDate(start.getUTCDate() - 29);
    for (let i = 0; i < 30; i += 1) {
      const d = new Date(start);
      d.setUTCDate(start.getUTCDate() + i);
      buckets.set(isoDay(d), { count: 0, amount: 0 });
    }
    for (const r of requests) {
      const day = isoDay(r.created_at);
      if (buckets.has(day)) {
        const b = buckets.get(day)!;
        b.count += 1;
        b.amount += r.total_amount;
      }
    }
    return Array.from(buckets.entries()).map(([date, v]) => ({
      date: date.slice(5),
      count: v.count,
      amount: Math.round(v.amount),
    }));
  }, [requests]);

  // Sparkline series for the four stat cards.
  const sparkSeries = useMemo(() => {
    return {
      total: trend.map((t, i) => ({ x: i, y: t.count })),
      amount: trend.map((t, i) => ({ x: i, y: t.amount })),
    };
  }, [trend]);

  // Department ranking (top 5 by total amount).
  const deptRanking: DeptRow[] = useMemo(() => {
    const m = new Map<string, number>();
    for (const r of requests) {
      const k = r.department || "—";
      m.set(k, (m.get(k) ?? 0) + r.total_amount);
    }
    return Array.from(m.entries())
      .map(([department, amount]) => ({ department, amount: Math.round(amount) }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
  }, [requests]);

  const highRiskList = useMemo(
    () =>
      requests
        .filter((r) => r.high_risk)
        .sort((a, b) => b.total_amount - a.total_amount)
        .slice(0, 5),
    [requests],
  );

  if (loading) return <DashboardSkeleton />;
  if (!summary) return null;

  // Mock month-over-month deltas (stable so screenshots are deterministic).
  const stats = [
    {
      label: t("dashboard.totalRequests"),
      value: summary.total_requests.toLocaleString(),
      tone: "text-neutral-190",
      delta: { up: true, value: "+12%" },
      spark: sparkSeries.total,
      sparkColor: "#0078D4",
    },
    {
      label: t("dashboard.highRiskApprovals"),
      value: summary.high_risk_count.toLocaleString(),
      tone: summary.high_risk_count > 0 ? "text-danger" : "text-neutral-190",
      delta: { up: summary.high_risk_count > 0, value: summary.high_risk_count > 0 ? "+1" : "0" },
      spark: sparkSeries.total.map((p) => ({ x: p.x, y: Math.min(p.y, summary.high_risk_count) })),
      sparkColor: "#A4262C",
    },
    {
      label: t("dashboard.openAmount"),
      value: formatCurrency(summary.total_amount_open),
      tone: "text-warning",
      delta: { up: false, value: "−4%" },
      spark: sparkSeries.amount,
      sparkColor: "#797673",
    },
    {
      label: t("dashboard.syncedAmount"),
      value: formatCurrency(summary.total_amount_synced),
      tone: "text-success",
      delta: { up: true, value: "+8%" },
      spark: sparkSeries.amount,
      sparkColor: "#107C10",
    },
  ];

  return (
    <div className="space-y-5">
      <Breadcrumb items={[{ label: t("breadcrumb.dashboard") }]} />

      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-xl font-semibold text-neutral-190">{t("dashboard.title")}</h2>
          <p className="text-sm text-neutral-130 mt-1">{t("dashboard.subtitle")}</p>
        </div>
        <Link to="/requests/new" className="btn-primary">
          <Plus size={14} strokeWidth={1.75} />
          {t("dashboard.newRequest")}
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="card p-4 flex flex-col">
            <div className="text-xs font-semibold text-neutral-130">{s.label}</div>
            <div className="flex items-end justify-between mt-2">
              <div className={cn("text-2xl font-semibold tabular-nums", s.tone)}>{s.value}</div>
              <span
                className={cn(
                  "inline-flex items-center gap-0.5 text-[11px] font-semibold tabular-nums",
                  s.delta.up ? "text-success" : "text-danger",
                )}
              >
                {s.delta.up ? (
                  <ArrowUp size={10} strokeWidth={2.5} />
                ) : (
                  <ArrowDown size={10} strokeWidth={2.5} />
                )}
                {s.delta.value}
              </span>
            </div>
            <div className="mt-2">
              <Sparkline data={s.spark} color={s.sparkColor} height={28} />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="card p-4 lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-neutral-190">
              {t("dashboard_v2.trend30d")}
            </h3>
            <Link to="/requests" className="text-xs text-brand-600 hover:underline">
              {t("common.viewAllArrow")}
            </Link>
          </div>
          <TrendChart
            data={trend}
            countLabel={t("dashboard_v2.trendCount")}
            amountLabel={t("dashboard_v2.trendAmount")}
          />
        </div>

        <div className="card p-4 space-y-3">
          <h3 className="text-sm font-semibold text-neutral-190">
            {t("dashboard.byStatus")}
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {STATUS_ORDER.map((s) => (
              <Link
                key={s}
                to={`/requests?status=${s}`}
                className="rounded border border-neutral-30 hover:border-brand-400 hover:bg-brand-50 p-3 transition-colors"
              >
                <div className="text-[10px] font-semibold text-neutral-130 uppercase tracking-wide">
                  {t(`status.${s}`)}
                </div>
                <div className="mt-1 text-xl font-semibold text-neutral-190 tabular-nums">
                  {summary.by_status[s] ?? 0}
                </div>
              </Link>
            ))}
            <Link
              to="/audit"
              className="rounded border border-neutral-30 hover:border-brand-400 hover:bg-brand-50 p-3 transition-colors"
            >
              <div className="text-[10px] font-semibold text-neutral-130 uppercase tracking-wide">
                {t("dashboard.recentFailures")}
              </div>
              <div
                className={cn(
                  "mt-1 text-xl font-semibold tabular-nums",
                  summary.recent_sync_failures > 0 ? "text-danger" : "text-success",
                )}
              >
                {summary.recent_sync_failures}
              </div>
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="card p-4 lg:col-span-2">
          <h3 className="text-sm font-semibold text-neutral-190 mb-3">
            {t("dashboard_v2.deptRanking")}
          </h3>
          {deptRanking.length === 0 ? (
            <div className="text-sm text-neutral-130 py-8 text-center">
              {t("dashboard_v2.noData")}
            </div>
          ) : (
            <DepartmentBar data={deptRanking} />
          )}
        </div>
        <div className="card p-4">
          <h3 className="text-sm font-semibold text-neutral-190 mb-3">
            {t("dashboard_v2.highRiskList")}
          </h3>
          {highRiskList.length === 0 ? (
            <div className="text-sm text-neutral-130 py-6 text-center">
              {t("dashboard_v2.noData")}
            </div>
          ) : (
            <ul className="divide-y divide-neutral-20 -mx-2">
              {highRiskList.map((r) => (
                <li key={r.id}>
                  <Link
                    to={`/requests/${r.id}`}
                    className="flex items-center justify-between gap-3 py-2 px-2 rounded hover:bg-neutral-10"
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-mono text-neutral-130">{r.number}</div>
                      <div className="text-sm text-neutral-190 truncate">
                        {r.description || r.vendor_name || r.vendor_no}
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <StatusBadge status={r.status} />
                        <HighRiskBadge value={r.high_risk} />
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-sm font-semibold tabular-nums">
                        {formatCurrency(r.total_amount, r.currency_code)}
                      </div>
                      <div className="text-[11px] text-neutral-90">
                        {formatDateShort(r.created_at)}
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
