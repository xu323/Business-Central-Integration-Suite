import * as RadixAlertDialog from "@radix-ui/react-alert-dialog";
import { useEffect, useState, type ReactNode } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/cn";

export interface AlertDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: ReactNode;
  /**
   * If supplied, the confirm button stays disabled until the user types
   * exactly this text (used for destructive actions like delete).
   */
  confirmationText?: string;
  confirmationLabel?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  loading?: boolean;
  onConfirm: () => void | Promise<void>;
}

export function AlertDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmationText,
  confirmationLabel,
  confirmLabel,
  cancelLabel,
  destructive,
  loading,
  onConfirm,
}: AlertDialogProps) {
  const { t } = useTranslation();
  const [typed, setTyped] = useState("");

  useEffect(() => {
    if (!open) setTyped("");
  }, [open]);

  const requiresConfirmation = !!confirmationText;
  const matchesConfirmation = !requiresConfirmation || typed === confirmationText;

  return (
    <RadixAlertDialog.Root open={open} onOpenChange={onOpenChange}>
      <RadixAlertDialog.Portal>
        <RadixAlertDialog.Overlay className="fixed inset-0 z-40 bg-neutral-190/40 backdrop-blur-sm data-[state=open]:animate-in data-[state=open]:fade-in" />
        <RadixAlertDialog.Content className="fixed left-1/2 top-1/2 z-50 w-[min(480px,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 rounded border border-neutral-40 bg-white shadow-flyout focus:outline-none data-[state=open]:animate-in data-[state=open]:fade-in data-[state=open]:zoom-in-95">
          <div className="p-5 space-y-4">
            <div className="flex items-start gap-3">
              {destructive && (
                <div className="rounded-full bg-danger-bg p-2 text-danger">
                  <AlertTriangle size={18} strokeWidth={1.75} />
                </div>
              )}
              <div className="flex-1">
                <RadixAlertDialog.Title className="text-base font-semibold text-neutral-190">
                  {title}
                </RadixAlertDialog.Title>
                {description && (
                  <RadixAlertDialog.Description asChild>
                    <div className="mt-1.5 text-sm text-neutral-130">{description}</div>
                  </RadixAlertDialog.Description>
                )}
              </div>
            </div>

            {requiresConfirmation && (
              <div>
                <label className="block text-xs font-semibold text-neutral-160 mb-1">
                  {confirmationLabel ??
                    t("dialog.typeToConfirm", { value: confirmationText })}
                </label>
                <input
                  type="text"
                  value={typed}
                  onChange={(e) => setTyped(e.target.value)}
                  className="w-full rounded border border-neutral-60 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                  autoFocus
                  spellCheck={false}
                  autoComplete="off"
                />
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <RadixAlertDialog.Cancel asChild>
                <button
                  type="button"
                  className="btn-outline"
                  disabled={loading}
                >
                  {cancelLabel ?? t("common.cancel")}
                </button>
              </RadixAlertDialog.Cancel>
              <button
                type="button"
                onClick={() => {
                  if (matchesConfirmation && !loading) {
                    void onConfirm();
                  }
                }}
                disabled={!matchesConfirmation || loading}
                className={cn(
                  destructive ? "btn-danger" : "btn-primary",
                  "min-w-[5rem]",
                )}
              >
                {loading && (
                  <Loader2 size={14} className="animate-spin" strokeWidth={2} />
                )}
                {confirmLabel ?? t("common.ok")}
              </button>
            </div>
          </div>
        </RadixAlertDialog.Content>
      </RadixAlertDialog.Portal>
    </RadixAlertDialog.Root>
  );
}
