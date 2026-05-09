import { Command } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { CommandPalette } from "@/components/CommandPalette";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { NotificationBell } from "@/components/NotificationBell";
import { OrgSwitcher } from "@/components/OrgSwitcher";
import { UserMenu } from "@/components/UserMenu";
import { api } from "@/lib/api";
import { cn } from "@/lib/cn";

export function Topbar() {
  const { t } = useTranslation();
  const [bcMode, setBcMode] = useState<string>("…");
  const [healthy, setHealthy] = useState<boolean>(false);
  const [version, setVersion] = useState<string>("");
  const [paletteOpen, setPaletteOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const tick = async () => {
      try {
        const res = await api.health();
        if (cancelled) return;
        setBcMode(res.bc_mode);
        setHealthy(res.status === "ok");
        setVersion(res.version);
      } catch {
        if (!cancelled) setHealthy(false);
      }
    };
    void tick();
    const id = setInterval(tick, 15000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  // Cmd/Ctrl+K opens command palette.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <header className="h-14 px-4 sm:px-6 border-b border-slate-200 bg-white flex items-center justify-between gap-3">
      <div className="flex items-center gap-3 min-w-0">
        <div className="hidden lg:block min-w-0">
          <h1 className="text-sm font-semibold text-slate-800 truncate">{t("app.title")}</h1>
          <p className="text-xs text-slate-500 truncate">{t("app.subtitle")}</p>
        </div>
        <div className="hidden lg:block w-px h-6 bg-slate-200" />
        <OrgSwitcher />
      </div>

      <div className="flex items-center gap-1 sm:gap-2">
        <button
          type="button"
          onClick={() => setPaletteOpen(true)}
          title={t("topbar.commandShortcut")}
          aria-label={t("topbar.commandShortcut")}
          className="hidden md:inline-flex items-center gap-2 rounded border border-slate-200 hover:bg-slate-50 px-2.5 py-1.5 text-xs text-slate-600"
        >
          <Command size={14} strokeWidth={1.75} />
          <span className="text-slate-400">⌘ K</span>
        </button>

        <div
          className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-50 border border-slate-200"
          title={`${healthy ? t("topbar.apiHealthy") : t("topbar.apiDown")} · ${t("topbar.bcModeLabel")}: ${bcMode}`}
        >
          <span
            className={cn(
              "inline-block w-1.5 h-1.5 rounded-full",
              healthy ? "bg-emerald-500" : "bg-rose-500",
            )}
            aria-hidden
          />
          <span className="text-[11px] font-medium text-slate-600">
            v{version || "—"}
          </span>
          <span className="text-[10px] text-slate-400">·</span>
          <span className="text-[10px] uppercase tracking-wide text-slate-500">
            {bcMode}
          </span>
        </div>

        <NotificationBell />
        <LanguageSwitcher />
        <div className="w-px h-6 bg-slate-200 mx-1" />
        <UserMenu />
      </div>

      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
    </header>
  );
}
