import * as Popover from "@radix-ui/react-popover";
import { Command } from "cmdk";
import { Check, ChevronDown } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/cn";

export interface ComboboxOption {
  value: string;
  label: string;
  description?: string;
}

interface Props {
  options: ComboboxOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  /** When true, the user can type a value not in the list. */
  allowCustom?: boolean;
}

export function Combobox({
  options,
  value,
  onChange,
  placeholder,
  disabled,
  className,
  allowCustom,
}: Props) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);
  const display = selected?.label ?? (allowCustom ? value : "");

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button
          type="button"
          disabled={disabled}
          aria-haspopup="listbox"
          aria-expanded={open}
          className={cn(
            "input flex items-center justify-between text-left",
            !display && "text-neutral-90",
            className,
          )}
        >
          <span className="truncate">{display || placeholder || t("common.selectPlaceholder")}</span>
          <ChevronDown size={14} strokeWidth={1.75} className="text-neutral-90 ml-2 shrink-0" />
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="start"
          sideOffset={4}
          className="z-50 w-[var(--radix-popover-trigger-width)] min-w-[200px] rounded border border-neutral-40 bg-white shadow-flyout focus:outline-none"
        >
          <Command className="flex flex-col max-h-[260px]">
            <Command.Input
              placeholder={t("common.search")}
              className="px-3 py-2 text-sm border-b border-neutral-30 focus:outline-none"
            />
            <Command.Empty className="px-3 py-6 text-center text-xs text-neutral-130">
              {t("commandPalette.empty")}
            </Command.Empty>
            <Command.List className="overflow-y-auto py-1">
              {options.map((opt) => (
                <Command.Item
                  key={opt.value}
                  value={`${opt.value} ${opt.label}`}
                  onSelect={() => {
                    onChange(opt.value);
                    setOpen(false);
                  }}
                  className={cn(
                    "flex items-center gap-2 px-3 py-1.5 text-sm cursor-pointer",
                    "data-[selected=true]:bg-brand-50 data-[selected=true]:text-brand-700",
                  )}
                >
                  <span className="flex-1">
                    <span className="block">{opt.label}</span>
                    {opt.description && (
                      <span className="block text-[11px] text-neutral-130">{opt.description}</span>
                    )}
                  </span>
                  {opt.value === value && (
                    <Check size={14} strokeWidth={2} className="text-brand-600" />
                  )}
                </Command.Item>
              ))}
            </Command.List>
          </Command>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
