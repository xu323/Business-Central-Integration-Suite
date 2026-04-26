import clsx from "clsx";
import { useTranslation } from "react-i18next";

import type { RequestStatus, SyncStatus } from "@/types";

const REQUEST_STYLES: Record<RequestStatus, string> = {
  Draft: "bg-slate-100 text-slate-700",
  Submitted: "bg-amber-100 text-amber-800",
  Approved: "bg-emerald-100 text-emerald-800",
  Rejected: "bg-rose-100 text-rose-800",
  Synced: "bg-brand-100 text-brand-700",
};

const SYNC_STYLES: Record<SyncStatus, string> = {
  Pending: "bg-amber-100 text-amber-800",
  Success: "bg-emerald-100 text-emerald-800",
  Failed: "bg-rose-100 text-rose-800",
};

export function StatusBadge({ status }: { status: RequestStatus }) {
  const { t } = useTranslation();
  return <span className={clsx("badge", REQUEST_STYLES[status])}>{t(`status.${status}`)}</span>;
}

export function SyncStatusBadge({ status }: { status: SyncStatus }) {
  const { t } = useTranslation();
  return <span className={clsx("badge", SYNC_STYLES[status])}>{t(`syncStatus.${status}`)}</span>;
}

export function HighRiskBadge({ value }: { value: boolean }) {
  const { t } = useTranslation();
  if (!value) return <span className="text-xs text-slate-400">—</span>;
  return <span className="badge bg-rose-100 text-rose-800">{t("highRisk.badge")}</span>;
}
