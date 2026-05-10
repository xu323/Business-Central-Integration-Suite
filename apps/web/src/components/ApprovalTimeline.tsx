import {
  Activity,
  Check,
  CircleDot,
  Plus,
  RefreshCw,
  SendHorizontal,
  Trash2,
  X,
  type LucideIcon,
} from "lucide-react";
import { useTranslation } from "react-i18next";

import { Avatar } from "@/components/Avatar";
import { cn } from "@/lib/cn";
import { formatDate } from "@/lib/format";
import type { AuditLog } from "@/types";

const ACTION_META: Record<string, { icon: LucideIcon; tone: string }> = {
  create:  { icon: Plus,            tone: "bg-neutral-30 text-neutral-160" },
  seed:    { icon: CircleDot,       tone: "bg-neutral-30 text-neutral-160" },
  submit:  { icon: SendHorizontal,  tone: "bg-warning-bg text-warning"      },
  approve: { icon: Check,           tone: "bg-success-bg text-success"      },
  reject:  { icon: X,               tone: "bg-danger-bg text-danger"        },
  sync:    { icon: RefreshCw,       tone: "bg-brand-100 text-brand-700"     },
  delete:  { icon: Trash2,          tone: "bg-neutral-30 text-neutral-160"  },
};

interface Props {
  logs: AuditLog[];
}

export function ApprovalTimeline({ logs }: Props) {
  const { t } = useTranslation();

  if (logs.length === 0) {
    return (
      <div className="text-sm text-neutral-130">{t("detail.noAuditEntries")}</div>
    );
  }

  // Audit logs come back newest-first. Render oldest at the top.
  const sorted = [...logs].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
  );

  return (
    <ol className="relative pl-6">
      <span
        aria-hidden
        className="absolute left-[11px] top-1 bottom-1 w-px bg-neutral-30"
      />
      {sorted.map((log) => {
        const meta = ACTION_META[log.action] ?? { icon: Activity, tone: "bg-neutral-30 text-neutral-160" };
        const Icon = meta.icon;
        return (
          <li key={log.id} className="relative pb-4 last:pb-0">
            <span
              className={cn(
                "absolute left-[-13px] top-0 inline-flex items-center justify-center w-6 h-6 rounded-full ring-2 ring-white",
                meta.tone,
              )}
              aria-hidden
            >
              <Icon size={12} strokeWidth={2} />
            </span>
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 ml-2">
              <span className="font-mono text-[11px] uppercase tracking-wider text-neutral-90">
                {t(`audit.action.${log.action}`, { defaultValue: log.action })}
              </span>
              <Avatar id={log.actor} name={log.actor || "system"} size="sm" />
              <span className="text-sm font-medium text-neutral-190">{log.actor}</span>
              <span className="text-xs text-neutral-130">{formatDate(log.timestamp)}</span>
            </div>
            {log.error_message && (
              <div className="ml-2 mt-1 text-xs text-danger">{log.error_message}</div>
            )}
          </li>
        );
      })}
    </ol>
  );
}
