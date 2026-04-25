import type { ReactNode } from "react";

interface Props {
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: string;
}

export function EmptyState({ title, description, action, icon = "📭" }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="text-4xl mb-3">{icon}</div>
      <div className="text-base font-medium text-slate-700">{title}</div>
      {description && (
        <p className="text-sm text-slate-500 mt-1 max-w-md">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
