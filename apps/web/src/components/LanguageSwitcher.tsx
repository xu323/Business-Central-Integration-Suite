import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Check, ChevronDown, Globe } from "lucide-react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/cn";
import {
  changeLanguage,
  currentLanguage,
  LANGUAGE_LABELS,
  SUPPORTED_LANGUAGES,
} from "@/i18n";

export function LanguageSwitcher() {
  const { t, i18n } = useTranslation();
  const active = currentLanguage();
  // i18n object accessed to register subscription with hook (re-render on language change).
  void i18n;

  const shortLabel = (t(`language.shortLabel.${active}`) as string) ?? LANGUAGE_LABELS[active];

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          title={t("language.switcherTitle")}
          aria-label={t("language.switcherTitle")}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded border border-neutral-40 hover:bg-neutral-10 transition-colors text-xs text-neutral-160"
        >
          <Globe size={14} strokeWidth={1.75} className="text-neutral-130" />
          <span className="font-medium">{shortLabel}</span>
          <ChevronDown size={12} strokeWidth={1.75} className="text-neutral-90" />
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={6}
          className="z-50 min-w-[180px] rounded border border-neutral-40 bg-white shadow-flyout p-1.5 focus:outline-none"
        >
          {SUPPORTED_LANGUAGES.map((lng) => (
            <DropdownMenu.Item
              key={lng}
              onSelect={() => changeLanguage(lng)}
              className={cn(
                "flex items-center gap-2 rounded px-2.5 py-2 text-sm outline-none cursor-pointer",
                lng === active
                  ? "bg-brand-50 text-brand-700 font-medium"
                  : "text-neutral-160 hover:bg-neutral-20",
              )}
            >
              <span className="flex-1">{LANGUAGE_LABELS[lng]}</span>
              {lng === active && (
                <Check size={14} strokeWidth={2} className="text-brand-600" />
              )}
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
