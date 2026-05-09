import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { ChevronDown, LogOut, Settings, SlidersHorizontal, Users } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Avatar } from "@/components/Avatar";
import { useCurrentUser } from "@/auth/useCurrentUser";
import { notify } from "@/lib/notify";

export function UserMenu() {
  const { t } = useTranslation();
  const user = useCurrentUser();
  if (!user) return null;

  const items = [
    {
      icon: Settings,
      label: t("topbar.userMenu.profile"),
      onSelect: () => notify.info(t("topbar.userMenu.profile"), { description: t("common.featureStub") }),
    },
    {
      icon: Users,
      label: t("topbar.userMenu.switchOrg"),
      onSelect: () => notify.info(t("topbar.userMenu.switchOrg"), { description: t("common.featureStub") }),
    },
    {
      icon: SlidersHorizontal,
      label: t("topbar.userMenu.preferences"),
      onSelect: () => notify.info(t("topbar.userMenu.preferences"), { description: t("common.featureStub") }),
    },
  ];

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          className="flex items-center gap-2 rounded-full hover:bg-neutral-20 transition-colors p-1 pr-2"
          title={user.email}
        >
          <Avatar id={user.id} name={user.name} size="sm" />
          <span className="hidden sm:inline text-sm font-medium text-neutral-160">{user.name}</span>
          <ChevronDown size={14} strokeWidth={1.75} className="text-neutral-90" />
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={8}
          className="z-50 min-w-[240px] rounded border border-neutral-40 bg-white shadow-flyout p-1.5 focus:outline-none"
        >
          <div className="px-2.5 py-2 border-b border-neutral-20 mb-1">
            <div className="flex items-center gap-3">
              <Avatar id={user.id} name={user.name} size="md" />
              <div className="min-w-0">
                <div className="text-sm font-semibold text-neutral-190 truncate">{user.name}</div>
                <div className="text-xs text-neutral-130 truncate">{user.email}</div>
                <div className="text-[10px] text-neutral-90 mt-0.5">{user.department} · {user.roles.join(" · ")}</div>
              </div>
            </div>
          </div>
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <DropdownMenu.Item
                key={item.label}
                onSelect={item.onSelect}
                className="flex items-center gap-2 rounded px-2.5 py-2 text-sm text-neutral-160 hover:bg-neutral-20 outline-none cursor-pointer"
              >
                <Icon size={16} strokeWidth={1.75} className="text-neutral-130" />
                {item.label}
              </DropdownMenu.Item>
            );
          })}
          <DropdownMenu.Separator className="h-px bg-neutral-20 my-1" />
          <DropdownMenu.Item
            onSelect={() => notify.info(t("topbar.userMenu.signOut"), { description: t("common.featureStub") })}
            className="flex items-center gap-2 rounded px-2.5 py-2 text-sm text-danger hover:bg-danger-bg outline-none cursor-pointer"
          >
            <LogOut size={16} strokeWidth={1.75} />
            {t("topbar.userMenu.signOut")}
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
