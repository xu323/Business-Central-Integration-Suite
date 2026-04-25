import type {
  AuditLog,
  DashboardSummary,
  HealthResponse,
  PurchaseRequest,
} from "@/types";

const API_BASE_URL: string =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${path}`;
  const res = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) {
    let detail = res.statusText;
    try {
      const body = await res.json();
      if (body?.detail) detail = body.detail;
    } catch {
      /* ignore */
    }
    throw new Error(`${res.status}: ${detail}`);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export const api = {
  health: () => request<HealthResponse>("/health"),
  listRequests: (params?: { status?: string; q?: string }) => {
    const search = new URLSearchParams();
    if (params?.status) search.set("status", params.status);
    if (params?.q) search.set("q", params.q);
    const qs = search.toString();
    return request<PurchaseRequest[]>(`/api/purchase-requests${qs ? `?${qs}` : ""}`);
  },
  getRequest: (id: string) => request<PurchaseRequest>(`/api/purchase-requests/${id}`),
  createRequest: (payload: unknown) =>
    request<PurchaseRequest>("/api/purchase-requests", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  submitRequest: (id: string, actor: string) =>
    request<PurchaseRequest>(`/api/purchase-requests/${id}/submit`, {
      method: "POST",
      body: JSON.stringify({ actor }),
    }),
  approveRequest: (id: string, actor: string, comment: string) =>
    request<PurchaseRequest>(`/api/purchase-requests/${id}/approve`, {
      method: "POST",
      body: JSON.stringify({ actor, comment }),
    }),
  rejectRequest: (id: string, actor: string, comment: string) =>
    request<PurchaseRequest>(`/api/purchase-requests/${id}/reject`, {
      method: "POST",
      body: JSON.stringify({ actor, comment }),
    }),
  syncRequest: (id: string) =>
    request<PurchaseRequest>(`/api/purchase-requests/${id}/sync-to-bc`, { method: "POST" }),
  deleteRequest: (id: string) =>
    request<void>(`/api/purchase-requests/${id}`, { method: "DELETE" }),
  listAuditLogs: (params?: { target_id?: string; action?: string }) => {
    const search = new URLSearchParams();
    if (params?.target_id) search.set("target_id", params.target_id);
    if (params?.action) search.set("action", params.action);
    const qs = search.toString();
    return request<AuditLog[]>(`/api/audit-logs${qs ? `?${qs}` : ""}`);
  },
  dashboardSummary: () => request<DashboardSummary>("/api/dashboard/summary"),
};
