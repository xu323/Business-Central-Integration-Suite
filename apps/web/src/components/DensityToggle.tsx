import { Rows2, Rows3, Rows4 } from "lucide-react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/cn";
import { useDensity, type Density } from "@/lib/density";

const ITEMS: { value: Density; icon: typeof Rows2 }[] = [
  { value: "compact", icon: Rows4 },
  { value: "standard", icon: Rows3 },
  { value: "comfortable", icon: Rows2 },
];

export function DensityToggle() {
  const { t } = useTranslation();
  const [density, setDensity] = useDensity();

  return (
    <div
      role="group"
      aria-label={t("table.density.label")}
      className="inline-flex border border-neutral-40 rounded h-8 overflow-hidden"
    >
      {ITEMS.map((item) => {
        const Icon = item.icon;
        const active = density === item.value;
        return (
          <button
            key={item.value}
            type="button"
            title={t(`table.density.${item.value}`)}
            aria-pressed={active}
            onClick={() => setDensity(item.value)}
            className={cn(
              "flex items-center justify-center w-8 transition-colors",
              active
                ? "bg-brand-50 text-brand-700"
                : "bg-white text-neutral-130 hover:bg-neutral-20",
            )}
          >
            <Icon size={14} strokeWidth={1.75} />
          </button>
        );
      })}
    </div>
  );
}
