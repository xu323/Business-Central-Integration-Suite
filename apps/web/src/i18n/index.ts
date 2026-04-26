import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";

import en from "@/i18n/locales/en.json";
import ja from "@/i18n/locales/ja.json";
import zhTW from "@/i18n/locales/zh-TW.json";

export const SUPPORTED_LANGUAGES = ["zh-TW", "en", "ja"] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export const LANGUAGE_LABELS: Record<SupportedLanguage, string> = {
  "zh-TW": "繁體中文",
  en: "English",
  ja: "日本語",
};

const STORAGE_KEY = "bcsuite.lang";

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      "zh-TW": { translation: zhTW },
      en: { translation: en },
      ja: { translation: ja },
    },
    fallbackLng: "zh-TW",
    supportedLngs: [...SUPPORTED_LANGUAGES],
    nonExplicitSupportedLngs: false,
    interpolation: { escapeValue: false },
    detection: {
      order: ["localStorage", "navigator", "htmlTag"],
      lookupLocalStorage: STORAGE_KEY,
      caches: ["localStorage"],
    },
    returnNull: false,
  });

export function changeLanguage(lng: SupportedLanguage): void {
  void i18n.changeLanguage(lng);
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, lng);
    document.documentElement.lang = lng;
  }
}

export function currentLanguage(): SupportedLanguage {
  const candidate = i18n.resolvedLanguage ?? i18n.language ?? "zh-TW";
  const matched = (SUPPORTED_LANGUAGES as readonly string[]).includes(candidate)
    ? (candidate as SupportedLanguage)
    : "zh-TW";
  return matched;
}

export default i18n;
