export type RequestStatus = "Draft" | "Submitted" | "Approved" | "Rejected" | "Synced";
export type SyncStatus = "Pending" | "Success" | "Failed";

export interface PurchaseRequestLine {
  id: string;
  line_no: number;
  item_no: string;
  description: string;
  quantity: number;
  unit_of_measure: string;
  unit_price: number;
  line_amount: number;
}

export interface PurchaseRequest {
  id: string;
  number: string;
  description: string;
  requester: string;
  department: string;
  vendor_no: string;
  vendor_name: string;
  document_date: string;
  required_date: string | null;
  currency_code: string;
  status: RequestStatus;
  total_amount: number;
  high_risk: boolean;
  approver: string;
  approval_comment: string;
  submitted_at: string | null;
  decided_at: string | null;
  bc_document_id: string;
  synced_at: string | null;
  created_at: string;
  updated_at: string;
  lines: PurchaseRequestLine[];
}

export interface AuditLog {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  target_type: string;
  target_id: string;
  sync_status: SyncStatus;
  error_message: string;
}

export interface DashboardSummary {
  total_requests: number;
  by_status: Record<string, number>;
  high_risk_count: number;
  total_amount_open: number;
  total_amount_synced: number;
  recent_sync_failures: number;
}

export interface HealthResponse {
  status: string;
  bc_mode: string;
  version: string;
}
