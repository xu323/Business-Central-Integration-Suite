import { clsx, type ClassValue } from "clsx";

/**
 * Tailwind class merger.
 * Wrap class strings with `cn(...)` to allow conditional / overriding.
 */
export function cn(...inputs: ClassValue[]): string {
  return clsx(inputs);
}
