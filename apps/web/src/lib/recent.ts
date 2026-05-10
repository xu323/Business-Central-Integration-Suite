/**
 * Recently-viewed purchase requests stored in localStorage.
 */
const STORAGE_KEY = "bcsuite.recent";
const MAX_ITEMS = 8;

export interface RecentItem {
  id: string;
  number: string;
  description: string;
  visitedAt: string;
}

export function readRecent(): RecentItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as RecentItem[];
    return Array.isArray(parsed) ? parsed.slice(0, MAX_ITEMS) : [];
  } catch {
    return [];
  }
}

export function pushRecent(item: Omit<RecentItem, "visitedAt">): void {
  if (typeof window === "undefined") return;
  const next: RecentItem[] = [
    { ...item, visitedAt: new Date().toISOString() },
    ...readRecent().filter((i) => i.id !== item.id),
  ].slice(0, MAX_ITEMS);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}
