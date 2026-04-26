import i18n from "@/i18n";

const LOCALE_FOR_INTL: Record<string, string> = {
  "zh-TW": "zh-TW",
  en: "en-US",
  ja: "ja-JP",
};

function activeIntlLocale(): string {
  const lang = i18n.resolvedLanguage ?? i18n.language ?? "zh-TW";
  return LOCALE_FOR_INTL[lang] ?? "zh-TW";
}

export function formatCurrency(amount: number, currency = "TWD"): string {
  if (Number.isNaN(amount)) return "-";
  try {
    return new Intl.NumberFormat(activeIntlLocale(), {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toLocaleString()}`;
  }
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString(activeIntlLocale(), { hour12: false });
}
