import { toast } from "sonner";

interface NotifyOptions {
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export const notify = {
  success(message: string, options?: NotifyOptions) {
    toast.success(message, {
      description: options?.description,
      action: options?.action,
    });
  },
  error(message: string, options?: NotifyOptions) {
    toast.error(message, {
      description: options?.description,
      action: options?.action,
      duration: 8000,
    });
  },
  info(message: string, options?: NotifyOptions) {
    toast.info(message, {
      description: options?.description,
      action: options?.action,
    });
  },
  warning(message: string, options?: NotifyOptions) {
    toast.warning(message, {
      description: options?.description,
      action: options?.action,
    });
  },
};

/**
 * Format a backend error into a user-facing toast string with a synthetic
 * error code (e.g. "[ERR-500] Internal Server Error").
 */
export function formatError(err: unknown): { code: string; message: string } {
  if (err instanceof Error) {
    // Backend errors come back as "503: detail" or similar.
    const m = err.message.match(/^(\d{3})\s*[:：]\s*(.+)$/);
    if (m) {
      return { code: `ERR-${m[1]}`, message: m[2] };
    }
    return { code: "ERR-CLIENT", message: err.message };
  }
  return { code: "ERR-UNKNOWN", message: String(err) };
}
