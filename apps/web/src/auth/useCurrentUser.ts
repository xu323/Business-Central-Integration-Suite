/**
 * useCurrentUser — front-end identity hook.
 *
 * Today: returns a deterministic mock user representing the signed-in
 * employee of the customer organisation. Designed to be replaced with
 * MSAL / OAuth (Microsoft Entra ID) without changing the consumer API.
 */
import { useEffect, useState } from "react";

export type UserRole = "Requester" | "Approver" | "Finance" | "Admin";
export type SupportedLocale = "zh-TW" | "en" | "ja";

export interface Organization {
  id: string;
  name: string;
}

export interface CurrentUser {
  id: string;
  name: string;
  email: string;
  department: string;
  avatar_url?: string;
  roles: UserRole[];
  locale: SupportedLocale;
  organization: Organization;
}

const MOCK_USER: CurrentUser = {
  id: "u-3f9c0a52",
  name: "翁○○",
  email: "weng.demo@cysoft-it.example",
  department: "資訊部",
  roles: ["Requester", "Approver"],
  locale: "zh-TW",
  organization: {
    id: "org-cysoft",
    name: "諮優系資訊科技",
  },
};

/**
 * Stable string → integer hash (32-bit), used to pick avatar palette colours.
 */
export function hashId(input: string): number {
  let h = 5381;
  for (let i = 0; i < input.length; i += 1) {
    h = ((h << 5) + h + input.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

const AVATAR_PALETTE = [
  ["#0078D4", "#FFFFFF"],
  ["#005A9E", "#FFFFFF"],
  ["#107C10", "#FFFFFF"],
  ["#A4262C", "#FFFFFF"],
  ["#5C2D91", "#FFFFFF"],
  ["#C19C00", "#FFFFFF"],
  ["#038387", "#FFFFFF"],
] as const;

export function avatarColors(id: string): { bg: string; fg: string } {
  const [bg, fg] = AVATAR_PALETTE[hashId(id) % AVATAR_PALETTE.length];
  return { bg, fg };
}

export function avatarInitials(name: string): string {
  if (!name) return "?";
  const trimmed = name.trim();
  // For CJK names, single character is the standard initial.
  if (/[㐀-鿿豈-﫿]/.test(trimmed)) {
    const cleaned = trimmed.replace(/[○●◯•·\s]/g, "");
    return cleaned.slice(0, 1) || trimmed.charAt(0);
  }
  // Latin: first letter of first + last token.
  const tokens = trimmed.split(/\s+/);
  if (tokens.length === 1) return tokens[0].charAt(0).toUpperCase();
  return (tokens[0].charAt(0) + tokens[tokens.length - 1].charAt(0)).toUpperCase();
}

export function hasRole(user: CurrentUser | null, role: UserRole): boolean {
  return !!user && user.roles.includes(role);
}

/**
 * Returns the current user. The consumer doesn't need to know whether the
 * source is a mock, a JWT decoded from MSAL, or an HTTP /me endpoint.
 */
export function useCurrentUser(): CurrentUser | null {
  const [user, setUser] = useState<CurrentUser | null>(MOCK_USER);

  useEffect(() => {
    // Future: const res = await msalClient.acquireToken({...}); setUser(decode(res.idToken));
    setUser(MOCK_USER);
  }, []);

  return user;
}
