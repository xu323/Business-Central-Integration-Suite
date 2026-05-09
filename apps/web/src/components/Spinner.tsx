import { Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";

interface Props {
  label?: string;
  size?: number;
}

export function Spinner({ label, size = 16 }: Props) {
  const { t } = useTranslation();
  return (
    <div className="flex items-center gap-2 text-sm text-slate-500 py-8 justify-center">
      <Loader2 size={size} className="animate-spin text-brand-600" strokeWidth={2} />
      {label ?? t("common.loading")}
    </div>
  );
}

export function InlineSpinner({ size = 14 }: { size?: number }) {
  return <Loader2 size={size} className="animate-spin" strokeWidth={2} />;
}
