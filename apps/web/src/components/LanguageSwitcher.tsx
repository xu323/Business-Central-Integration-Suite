import { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { useTranslation } from "react-i18next";

import {
  changeLanguage,
  currentLanguage,
  LANGUAGE_LABELS,
  SUPPORTED_LANGUAGES,
  type SupportedLanguage,
} from "@/i18n";

const FLAGS: Record<SupportedLanguage, string> = {
  "zh-TW": "🇹🇼",
  en: "🇬🇧",
  ja: "🇯🇵",
};

export function LanguageSwitcher() {
  const { t, i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);
  const active = currentLanguage();

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  // Re-render on language change.
  useEffect(() => {
    const onChange = () => setOpen(false);
    i18n.on("languageChanged", onChange);
    return () => i18n.off("languageChanged", onChange);
  }, [i18n]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        title={t("language.switcherTitle")}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-white border border-slate-200 text-xs text-slate-700 hover:border-brand-400 hover:bg-brand-50"
        onClick={() => setOpen((v) => !v)}
      >
        <span aria-hidden>{FLAGS[active]}</span>
        <span className="font-medium">{LANGUAGE_LABELS[active]}</span>
        <span className="text-slate-400" aria-hidden>
          ▾
        </span>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-44 rounded-lg border border-slate-200 bg-white shadow-card overflow-hidden z-20"
        >
          {SUPPORTED_LANGUAGES.map((lng) => (
            <button
              key={lng}
              type="button"
              role="menuitem"
              onClick={() => changeLanguage(lng)}
              className={clsx(
                "w-full text-left px-3 py-2 text-sm flex items-center gap-2 transition-colors",
                lng === active
                  ? "bg-brand-50 text-brand-700 font-medium"
                  : "text-slate-700 hover:bg-slate-50",
              )}
            >
              <span aria-hidden>{FLAGS[lng]}</span>
              <span>{LANGUAGE_LABELS[lng]}</span>
              {lng === active && <span className="ml-auto text-brand-500">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
