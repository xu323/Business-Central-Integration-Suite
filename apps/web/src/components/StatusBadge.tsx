import { AlertTriangle } from "lucide-react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/cn";
import type { RequestStatus, SyncStatus } from "@/types";

interface BadgeStyle {
  bg: string;
  text: string;
  dot: string;
}

const REQUEST_STYLES: Record<RequestStatus, BadgeStyle> = {
  Draft:     { bg: "bg-slate-100",   text: "text-slate-700",   dot: "bg-slate-400" },
  Submitted: { bg: "bg-amber-100",   text: "text-amber-800",   dot: "bg-amber-500" },
  Approved:  { bg: "bg-emerald-100", text: "text-emerald-800", dot: "bg-emerald-500" },
  Rejected:  { bg: "bg-rose-100",    text: "text-rose-800",    dot: "bg-rose-500" },
  Synced:    { bg: "bg-brand-100",   text: "text-brand-700",   dot: "bg-brand-500" },
};

const SYNC_STYLES: Record<SyncStatus, BadgeStyle> = {
  Pending: { bg: "bg-amber-100",   text: "text-amber-800",   dot: "bg-amber-500" },
  Success: { bg: "bg-emerald-100", text: "text-emerald-800", dot: "bg-emerald-500" },
  Failed:  { bg: "bg-rose-100",    text: "text-rose-800",    dot: "bg-rose-500" },
};

export function StatusBadge({ status }: { status: RequestStatus }) {
  const { t } = useTranslation();
  const s = REQUEST_STYLES[status];
  return (
    <span className={cn("badge inline-flex items-center gap-1.5", s.bg, s.text)}>
      <span className={cn("w-1.5 h-1.5 rounded-full", s.dot)} aria-hidden />
      {t(`status.${status}`)}
    </span>
  );
}

export function SyncStatusBadge({ status }: { status: SyncStatus }) {
  const { t } = useTranslation();
  const s = SYNC_STYLES[status];
  return (
    <span className={cn("badge inline-flex items-center gap-1.5", s.bg, s.text)}>
      <span className={cn("w-1.5 h-1.5 rounded-full", s.dot)} aria-hidden />
      {t(`syncStatus.${status}`)}
    </span>
  );
}

export function HighRiskBadge({ value }: { value: boolean }) {
  const { t } = useTranslation();
  if (!value) return <span className="text-xs text-slate-400">—</span>;
  return (
    <span className="badge inline-flex items-center gap-1 bg-rose-100 text-rose-800">
      <AlertTriangle size={12} strokeWidth={2} />
      {t("highRisk.badge")}
    </span>
  );
}
