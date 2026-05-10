/**
 * Table density preference shared across the app.
 * Persisted to localStorage as `bcsuite.density`.
 */
import { useEffect, useState } from "react";

export type Density = "compact" | "standard" | "comfortable";
const STORAGE_KEY = "bcsuite.density";

export const DENSITY_HEIGHTS: Record<Density, string> = {
  compact: "row-compact",
  standard: "row-standard",
  comfortable: "row-comfortable",
};

const listeners = new Set<(d: Density) => void>();

function read(): Density {
  if (typeof window === "undefined") return "standard";
  const v = window.localStorage.getItem(STORAGE_KEY);
  return v === "compact" || v === "comfortable" ? v : "standard";
}

export function setDensity(d: Density): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, d);
  listeners.forEach((l) => l(d));
}

export function useDensity(): [Density, (d: Density) => void] {
  const [value, setValue] = useState<Density>(() => read());

  useEffect(() => {
    const onChange = (d: Density) => setValue(d);
    listeners.add(onChange);
    return () => {
      listeners.delete(onChange);
    };
  }, []);

  return [value, setDensity];
}
