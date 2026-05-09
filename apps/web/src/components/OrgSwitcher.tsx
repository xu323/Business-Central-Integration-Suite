import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Building2, Check, ChevronDown } from "lucide-react";
import { useTranslation } from "react-i18next";

import { useCurrentUser } from "@/auth/useCurrentUser";
import { notify } from "@/lib/notify";

export function OrgSwitcher() {
  const { t } = useTranslation();
  const user = useCurrentUser();
  if (!user) return null;

  const orgs = [user.organization]; // TODO: backend endpoint /api/me/organizations

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          className="flex items-center gap-2 rounded border border-neutral-40 hover:bg-neutral-10 transition-colors px-2.5 py-1.5 text-xs"
          title={t("topbar.orgSwitcher.title")}
        >
          <Building2 size={14} strokeWidth={1.75} className="text-neutral-130" />
          <span className="font-medium text-neutral-160 max-w-[12rem] truncate">
            {user.organization.name}
          </span>
          <ChevronDown size={12} strokeWidth={1.75} className="text-neutral-90" />
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="start"
          sideOffset={6}
          className="z-50 min-w-[240px] rounded border border-neutral-40 bg-white shadow-flyout p-1.5 focus:outline-none"
        >
          <div className="px-2.5 py-1.5 text-[10px] font-semibold tracking-wide text-neutral-90 uppercase">
            {t("topbar.orgSwitcher.title")}
          </div>
          {orgs.map((org) => (
            <DropdownMenu.Item
              key={org.id}
              onSelect={() => notify.info(t("topbar.orgSwitcher.switchedTo", { name: org.name }))}
              className="flex items-center gap-2 rounded px-2.5 py-2 text-sm outline-none cursor-pointer hover:bg-neutral-20"
            >
              <Building2 size={16} strokeWidth={1.75} className="text-neutral-130" />
              <span className="flex-1">{org.name}</span>
              {org.id === user.organization.id && (
                <Check size={14} strokeWidth={2} className="text-brand-600" />
              )}
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
