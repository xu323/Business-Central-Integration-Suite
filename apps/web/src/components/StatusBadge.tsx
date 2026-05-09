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
  Draft:     { bg: "bg-neutral-20",   text: "text-neutral-160",   dot: "bg-neutral-90" },
  Submitted: { bg: "bg-warning-bg",   text: "text-warning",   dot: "bg-warning" },
  Approved:  { bg: "bg-success-bg", text: "text-success", dot: "bg-success" },
  Rejected:  { bg: "bg-danger-bg",    text: "text-danger",    dot: "bg-danger" },
  Synced:    { bg: "bg-brand-100",   text: "text-brand-700",   dot: "bg-brand-500" },
};

const SYNC_STYLES: Record<SyncStatus, BadgeStyle> = {
  Pending: { bg: "bg-warning-bg",   text: "text-warning",   dot: "bg-warning" },
  Success: { bg: "bg-success-bg", text: "text-success", dot: "bg-success" },
  Failed:  { bg: "bg-danger-bg",    text: "text-danger",    dot: "bg-danger" },
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
  if (!value) return <span className="text-xs text-neutral-90">—</span>;
  return (
    <span className="badge inline-flex items-center gap-1 bg-danger-bg text-danger">
      <AlertTriangle size={12} strokeWidth={2} />
      {t("highRisk.badge")}
    </span>
  );
}
