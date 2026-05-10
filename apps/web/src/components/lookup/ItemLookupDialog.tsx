import * as Dialog from "@radix-ui/react-dialog";
import { Search, X } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/cn";
import { ITEMS, type ItemRow } from "@/components/lookup/sample-data";
import { formatCurrency } from "@/lib/format";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (item: ItemRow) => void;
}

export function ItemLookupDialog({ open, onOpenChange, onSelect }: Props) {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return ITEMS;
    return ITEMS.filter(
      (i) =>
        i.no.toLowerCase().includes(q) ||
        i.name.toLowerCase().includes(q) ||
        i.category.toLowerCase().includes(q),
    );
  }, [query]);

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-neutral-190/40 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[min(720px,calc(100vw-2rem))] max-h-[80vh] -translate-x-1/2 -translate-y-1/2 rounded border border-neutral-40 bg-white shadow-flyout focus:outline-none flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-30">
            <Dialog.Title className="text-base font-semibold text-neutral-190">
              {t("lookup.item.title")}
            </Dialog.Title>
            <Dialog.Close asChild>
              <button type="button" className="btn-subtle h-8 w-8 px-0">
                <X size={14} strokeWidth={1.75} />
              </button>
            </Dialog.Close>
          </div>
          <Dialog.Description className="sr-only">{t("lookup.item.description")}</Dialog.Description>

          <div className="px-4 py-3 border-b border-neutral-30">
            <div className="relative">
              <Search
                size={14}
                strokeWidth={1.75}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-90"
              />
              <input
                autoFocus
                className="input pl-8"
                placeholder={t("lookup.item.placeholder")}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="bg-neutral-10 text-neutral-130 text-xs font-semibold sticky top-0">
                <tr>
                  <th className="text-left px-4 py-2">{t("lookup.item.cols.no")}</th>
                  <th className="text-left px-4 py-2">{t("lookup.item.cols.name")}</th>
                  <th className="text-left px-4 py-2">{t("lookup.item.cols.category")}</th>
                  <th className="text-left px-4 py-2">{t("lookup.item.cols.uom")}</th>
                  <th className="text-right px-4 py-2">{t("lookup.item.cols.unitPrice")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-20">
                {filtered.map((it) => (
                  <tr
                    key={it.no}
                    className={cn("row-standard hover:bg-brand-50/40 cursor-pointer")}
                    onClick={() => {
                      onSelect(it);
                      onOpenChange(false);
                    }}
                  >
                    <td className="px-4 font-mono text-xs">{it.no}</td>
                    <td className="px-4">{it.name}</td>
                    <td className="px-4 text-neutral-130">{it.category}</td>
                    <td className="px-4 text-neutral-130">{it.uom}</td>
                    <td className="px-4 text-right font-medium">{formatCurrency(it.unitPrice)}</td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-sm text-neutral-130">
                      {t("commandPalette.empty")}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="px-4 py-2.5 text-xs text-neutral-130 border-t border-neutral-30">
            {t("lookup.item.footer", { count: filtered.length })}
            <span className="ml-2 text-neutral-90">{t("lookup.vendor.stub")}</span>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
