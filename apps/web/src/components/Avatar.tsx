import { avatarColors, avatarInitials } from "@/auth/useCurrentUser";
import { cn } from "@/lib/cn";

interface Props {
  id: string;
  name: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const SIZE_CLASS = {
  sm: "w-7 h-7 text-xs",
  md: "w-9 h-9 text-sm",
  lg: "w-12 h-12 text-base",
} as const;

export function Avatar({ id, name, size = "md", className }: Props) {
  const colors = avatarColors(id);
  const initials = avatarInitials(name);
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-full font-semibold select-none",
        SIZE_CLASS[size],
        className,
      )}
      style={{ backgroundColor: colors.bg, color: colors.fg }}
      aria-hidden
    >
      {initials}
    </span>
  );
}
