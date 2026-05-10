import { format as fnsFormat } from "date-fns";
import { enUS, ja, zhTW, type Locale } from "date-fns/locale";

import i18n from "@/i18n";

const INTL_LOCALE: Record<string, string> = {
  "zh-TW": "zh-TW",
  en: "en-US",
  ja: "ja-JP",
};

const DATE_LOCALE: Record<string, Locale> = {
  "zh-TW": zhTW,
  en: enUS,
  ja: ja,
};

const DATE_PATTERN: Record<string, string> = {
  "zh-TW": "yyyy/MM/dd HH:mm",
  en: "MMM d, yyyy HH:mm",
  ja: "yyyy年M月d日 HH:mm",
};

const DATE_PATTERN_SHORT: Record<string, string> = {
  "zh-TW": "yyyy/MM/dd",
  en: "MMM d, yyyy",
  ja: "yyyy年M月d日",
};

function activeLang(): string {
  return i18n.resolvedLanguage ?? i18n.language ?? "zh-TW";
}

function intlLocale(): string {
  return INTL_LOCALE[activeLang()] ?? "zh-TW";
}

export function formatCurrency(amount: number | null | undefined, currency = "TWD"): string {
  if (amount == null || Number.isNaN(amount)) return "—";
  try {
    return new Intl.NumberFormat(intlLocale(), {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toLocaleString()}`;
  }
}

export function formatNumber(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "—";
  return new Intl.NumberFormat(intlLocale()).format(value);
}

export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return "—";
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "—";
  const lang = activeLang();
  return fnsFormat(d, DATE_PATTERN[lang] ?? DATE_PATTERN["zh-TW"], {
    locale: DATE_LOCALE[lang] ?? zhTW,
  });
}

export function formatDateShort(value: string | Date | null | undefined): string {
  if (!value) return "—";
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "—";
  const lang = activeLang();
  return fnsFormat(d, DATE_PATTERN_SHORT[lang] ?? DATE_PATTERN_SHORT["zh-TW"], {
    locale: DATE_LOCALE[lang] ?? zhTW,
  });
}

/**
 * Returns the day-of-month YYYY-MM-DD slice in UTC for grouping.
 */
export function isoDay(value: string | Date): string {
  const d = typeof value === "string" ? new Date(value) : value;
  return d.toISOString().slice(0, 10);
}
