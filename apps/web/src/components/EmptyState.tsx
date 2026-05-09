import { Inbox, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

interface Props {
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: LucideIcon;
}

export function EmptyState({ title, description, action, icon: Icon = Inbox }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="rounded-full bg-slate-100 p-3 mb-3 text-slate-400">
        <Icon size={28} strokeWidth={1.5} />
      </div>
      <div className="text-base font-medium text-slate-700">{title}</div>
      {description && (
        <p className="text-sm text-slate-500 mt-1 max-w-md">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
