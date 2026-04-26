import { useTranslation } from "react-i18next";

export function Spinner({ label }: { label?: string }) {
  const { t } = useTranslation();
  return (
    <div className="flex items-center gap-2 text-sm text-slate-500 py-8 justify-center">
      <span className="inline-block w-4 h-4 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      {label ?? t("common.loading")}
    </div>
  );
}
