import * as Dialog from "@radix-ui/react-dialog";
import {
  ChevronRight,
  FilePlus2,
  FileText,
  LayoutDashboard,
  Search,
  ScrollText,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import { cn } from "@/lib/cn";

interface CommandItem {
  id: string;
  group: "pages" | "actions";
  labelKey: string;
  to: string;
  icon: typeof LayoutDashboard;
  hint?: string;
}

const COMMANDS: CommandItem[] = [
  { id: "nav-dashboard", group: "pages", labelKey: "nav.dashboard", to: "/", icon: LayoutDashboard },
  { id: "nav-requests", group: "pages", labelKey: "nav.requests", to: "/requests", icon: FileText },
  { id: "nav-audit", group: "pages", labelKey: "nav.auditLogs", to: "/audit", icon: ScrollText },
  { id: "act-new-request", group: "actions", labelKey: "nav.createRequest", to: "/requests/new", icon: FilePlus2 },
  { id: "act-pending", group: "actions", labelKey: "commandPalette.viewPendingApproval", to: "/requests?status=Submitted", icon: FileText },
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommandPalette({ open, onOpenChange }: Props) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setActiveIndex(0);
    }
  }, [open]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return COMMANDS;
    return COMMANDS.filter((c) => t(c.labelKey).toLowerCase().includes(q));
  }, [query, t]);

  const groupedFiltered = useMemo(() => {
    return {
      pages: filtered.filter((c) => c.group === "pages"),
      actions: filtered.filter((c) => c.group === "actions"),
    };
  }, [filtered]);

  const flat = [...groupedFiltered.pages, ...groupedFiltered.actions];

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, flat.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const item = flat[activeIndex];
      if (item) {
        navigate(item.to);
        onOpenChange(false);
      }
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-neutral-190/40 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-[20%] z-50 w-[min(560px,calc(100vw-2rem))] -translate-x-1/2 rounded border border-neutral-40 bg-white shadow-flyout focus:outline-none">
          <Dialog.Title className="sr-only">{t("commandPalette.title")}</Dialog.Title>
          <div className="flex items-center gap-2 px-4 py-3 border-b border-neutral-40">
            <Search size={18} strokeWidth={1.75} className="text-neutral-90" />
            <input
              autoFocus
              value={query}
              placeholder={t("commandPalette.placeholder")}
              onChange={(e) => {
                setQuery(e.target.value);
                setActiveIndex(0);
              }}
              onKeyDown={onKeyDown}
              className="flex-1 bg-transparent text-sm focus:outline-none"
            />
            <kbd className="text-[10px] font-semibold text-neutral-90 px-1.5 py-0.5 border border-neutral-40 rounded">
              ESC
            </kbd>
          </div>

          <div className="max-h-[60vh] overflow-y-auto py-2">
            {flat.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-neutral-130">
                {t("commandPalette.empty")}
              </div>
            ) : (
              (["pages", "actions"] as const).map((group) => {
                const items = groupedFiltered[group];
                if (items.length === 0) return null;
                return (
                  <div key={group} className="px-2 pb-2">
                    <div className="px-2 py-1.5 text-[10px] font-semibold tracking-wide text-neutral-90 uppercase">
                      {t(`commandPalette.groups.${group}`)}
                    </div>
                    {items.map((item) => {
                      const flatIdx = flat.indexOf(item);
                      const Icon = item.icon;
                      const isActive = flatIdx === activeIndex;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onMouseEnter={() => setActiveIndex(flatIdx)}
                          onClick={() => {
                            navigate(item.to);
                            onOpenChange(false);
                          }}
                          className={cn(
                            "w-full flex items-center gap-3 rounded px-2 py-2 text-sm text-left",
                            isActive ? "bg-brand-50 text-brand-700" : "text-neutral-160 hover:bg-neutral-10",
                          )}
                        >
                          <Icon size={16} strokeWidth={1.75} />
                          <span className="flex-1">{t(item.labelKey)}</span>
                          <ChevronRight size={14} strokeWidth={1.75} className="text-neutral-90" />
                        </button>
                      );
                    })}
                  </div>
                );
              })
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
