import * as Popover from "@radix-ui/react-popover";
import { Bell, BellOff } from "lucide-react";
import { useTranslation } from "react-i18next";

export function NotificationBell() {
  const { t } = useTranslation();
  const unread = 0; // TODO: backend endpoint /api/notifications

  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <button
          type="button"
          className="relative rounded-full hover:bg-slate-100 transition-colors w-9 h-9 inline-flex items-center justify-center"
          title={t("topbar.notifications.title")}
          aria-label={t("topbar.notifications.title")}
        >
          <Bell size={18} strokeWidth={1.75} className="text-slate-600" />
          {unread > 0 && (
            <span className="absolute top-1.5 right-1.5 inline-flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full text-[10px] font-semibold bg-rose-600 text-white">
              {unread > 99 ? "99+" : unread}
            </span>
          )}
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="end"
          sideOffset={8}
          className="z-50 w-[360px] rounded-md border border-slate-200 bg-white shadow-flyout focus:outline-none"
        >
          <div className="px-4 py-3 border-b border-slate-100">
            <h3 className="text-sm font-semibold text-slate-900">{t("topbar.notifications.title")}</h3>
          </div>
          <div className="px-6 py-10 text-center text-sm text-slate-500 flex flex-col items-center gap-3">
            <BellOff size={28} strokeWidth={1.5} className="text-slate-300" />
            <span>{t("topbar.notifications.empty")}</span>
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
