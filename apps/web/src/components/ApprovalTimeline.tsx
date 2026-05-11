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

/**
 * Vertical approval timeline. Each row is a 2-column flex (icon | content)
 * so the action label can never collide with the bg-circle icon.
 * A 1px rail is drawn behind the icon column at exactly its midline (left-3).
 */
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
    <ol className="relative space-y-4">
      {/* Vertical rail behind the icon column (icon is w-6 = 24px → midline at 12px = left-3). */}
      {sorted.length > 1 && (
        <span
          aria-hidden
          className="absolute left-3 top-3 bottom-3 w-px bg-neutral-30 -translate-x-1/2"
        />
      )}
      {sorted.map((log) => {
        const meta =
          ACTION_META[log.action] ?? { icon: Activity, tone: "bg-neutral-30 text-neutral-160" };
        const Icon = meta.icon;
        return (
          <li key={log.id} className="relative flex items-start gap-3">
            <span
              className={cn(
                "relative z-10 inline-flex shrink-0 items-center justify-center",
                "w-6 h-6 rounded-full ring-2 ring-white",
                meta.tone,
              )}
              aria-hidden
            >
              <Icon size={12} strokeWidth={2} />
            </span>
            <div className="flex-1 min-w-0 pt-0.5">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className="font-mono text-[11px] uppercase tracking-wider text-neutral-130">
                  {t(`audit.action.${log.action}`, { defaultValue: log.action })}
                </span>
                <Avatar id={log.actor} name={log.actor || "system"} size="sm" />
                <span className="text-sm font-medium text-neutral-190">{log.actor}</span>
                <span className="text-xs text-neutral-130">{formatDate(log.timestamp)}</span>
              </div>
              {log.error_message && (
                <div className="mt-1 text-xs text-danger">{log.error_message}</div>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
