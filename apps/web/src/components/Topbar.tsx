import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { api } from "@/lib/api";

export function Topbar() {
  const { t } = useTranslation();
  const [bcMode, setBcMode] = useState<string>("…");
  const [healthy, setHealthy] = useState<boolean>(false);
  const [version, setVersion] = useState<string>("");

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
    tick();
    const id = setInterval(tick, 15000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  return (
    <header className="h-14 px-6 border-b border-slate-200 bg-white flex items-center justify-between">
      <div>
        <h1 className="text-base font-semibold text-slate-800">{t("app.title")}</h1>
        <p className="text-xs text-slate-500">{t("app.subtitle")}</p>
      </div>
      <div className="flex items-center gap-3">
        <div className="text-xs text-slate-500">v{version || "—"}</div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 border border-slate-200">
          <span
            className={`inline-block w-2 h-2 rounded-full ${
              healthy ? "bg-emerald-500" : "bg-rose-500"
            }`}
            aria-hidden
          />
          <span className="text-xs font-medium text-slate-700">
            {healthy ? t("topbar.apiHealthy") : t("topbar.apiDown")}
          </span>
          <span className="text-xs text-slate-400">·</span>
          <span className="text-xs uppercase tracking-wide text-slate-500">
            {t("topbar.bcModeLabel")}: {bcMode}
          </span>
        </div>
        <LanguageSwitcher />
      </div>
    </header>
  );
}
