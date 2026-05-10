import { ChevronRight } from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";

export interface Crumb {
  label: ReactNode;
  to?: string;
}

interface Props {
  items: Crumb[];
}

export function Breadcrumb({ items }: Props) {
  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-xs text-neutral-130 mb-2">
      {items.map((c, idx) => {
        const last = idx === items.length - 1;
        return (
          <span key={idx} className="inline-flex items-center gap-1">
            {c.to && !last ? (
              <Link to={c.to} className="hover:text-neutral-190 hover:underline">
                {c.label}
              </Link>
            ) : (
              <span className={last ? "text-neutral-190 font-medium" : undefined}>{c.label}</span>
            )}
            {!last && <ChevronRight size={12} strokeWidth={1.75} className="text-neutral-90" />}
          </span>
        );
      })}
    </nav>
  );
}
