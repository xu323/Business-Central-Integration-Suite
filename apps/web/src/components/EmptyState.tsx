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
      <div className="rounded-full bg-neutral-20 p-3 mb-3 text-neutral-90">
        <Icon size={28} strokeWidth={1.5} />
      </div>
      <div className="text-base font-medium text-neutral-160">{title}</div>
      {description && (
        <p className="text-sm text-neutral-130 mt-1 max-w-md">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
