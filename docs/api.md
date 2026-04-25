# REST API 規格

> 所有端點都在 `http://localhost:8000`（dev）或對應部署位址；OpenAPI 互動式文件在 `/docs`，OpenAPI JSON 在 `/openapi.json`。

## 1. Health

### `GET /health`

```json
{ "status": "ok", "bc_mode": "mock", "version": "1.0.0" }
```

| 欄位 | 說明 |
|------|------|
| `status` | `ok` 表示 API 正常 |
| `bc_mode` | `mock` 或 `real` |

## 2. Purchase Requests

### `GET /api/purchase-requests`

| Query | 型別 | 說明 |
|-------|------|------|
| `status` | `Draft\|Submitted\|Approved\|Rejected\|Synced` | 篩選狀態 |
| `q` | string | 模糊搜尋 description / vendor / requester |

回傳 `PurchaseRequestOut[]`。

### `GET /api/purchase-requests/{id}`

回傳單筆 `PurchaseRequestOut`，含 `lines[]`。

### `POST /api/purchase-requests`

建立 Draft。

```json
{
  "description": "Office laptops",
  "requester": "alice.chen",
  "department": "IT",
  "vendor_no": "V0001",
  "vendor_name": "Acme",
  "currency_code": "TWD",
  "required_date": "2026-05-30T00:00:00Z",
  "lines": [
    { "item_no": "ITEM-LAP", "description": "13\" laptop", "quantity": 5, "unit_price": 38000 }
  ]
}
```

回傳 201 + `PurchaseRequestOut`。

### `POST /api/purchase-requests/{id}/submit`

```json
{ "actor": "alice.chen" }
```

只能對 `Draft` 呼叫；至少要有 1 條 line。

### `POST /api/purchase-requests/{id}/approve`

```json
{ "actor": "manager", "comment": "Looks good." }
```

只能對 `Submitted` 呼叫。

### `POST /api/purchase-requests/{id}/reject`

```json
{ "actor": "manager", "comment": "Out of budget." }
```

只能對 `Submitted` 呼叫。

### `POST /api/purchase-requests/{id}/sync-to-bc`

只能對 `Approved` 呼叫。Mock 模式回傳 `bc_document_id` 為 `PO-MOCK-PR…`；real 模式由 BC 回傳。

失敗時回 502，並在 audit log 留下 `sync_status=Failed`。

### `DELETE /api/purchase-requests/{id}`

只能刪除 `Draft` 或 `Rejected`。回傳 204。

## 3. Audit Logs

### `GET /api/audit-logs`

| Query | 說明 |
|-------|------|
| `target_id` | 只看單筆請購的稽核 |
| `action` | `create\|submit\|approve\|reject\|sync\|delete` |
| `sync_status` | `Pending\|Success\|Failed` |
| `limit` | 1–1000，預設 200 |

回傳 `AuditLogOut[]`，依時間倒序。

## 4. Dashboard

### `GET /api/dashboard/summary`

```json
{
  "total_requests": 4,
  "by_status": { "Draft": 1, "Submitted": 1, "Approved": 1, "Rejected": 0, "Synced": 1 },
  "high_risk_count": 2,
  "total_amount_open": 380000.0,
  "total_amount_synced": 250000.0,
  "recent_sync_failures": 0
}
```

## 5. Schemas（要點）

### PurchaseRequestOut

```ts
{
  id: string;                // UUID
  number: string;            // PR + yyyymmdd + nnnn
  description: string;
  requester: string;
  department: string;
  vendor_no: string;
  vendor_name: string;
  document_date: string;     // ISO
  required_date: string|null;
  currency_code: string;
  status: "Draft"|"Submitted"|"Approved"|"Rejected"|"Synced";
  total_amount: number;
  high_risk: boolean;        // ≥ HIGH_RISK_THRESHOLD
  approver: string;
  approval_comment: string;
  submitted_at: string|null;
  decided_at: string|null;
  bc_document_id: string;
  synced_at: string|null;
  created_at: string;
  updated_at: string;
  lines: PurchaseRequestLineOut[];
}
```

### PurchaseRequestLineOut

```ts
{
  id: string;
  line_no: number;
  item_no: string;
  description: string;
  quantity: number;
  unit_of_measure: string;
  unit_price: number;
  line_amount: number;
}
```

### AuditLogOut

```ts
{
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  target_type: string;       // "PurchaseRequest"
  target_id: string;
  sync_status: "Pending"|"Success"|"Failed";
  error_message: string;
}
```

## 6. 對應的 BC OData API（real 模式）

當 `BC_MODE=real`，後端會 POST 到：

```
POST {BC_BASE_URL}/{BC_TENANT_ID}/{BC_ENVIRONMENT}/api/xu323/integration/v1.0/companies({BC_COMPANY_ID})/purchaseRequests
Authorization: Bearer <token from login.microsoftonline.com>
Content-Type: application/json
```

對應的 AL API Page：[`extensions/bc-procurement/src/api/PurchaseRequestAPI.al`](../extensions/bc-procurement/src/api/PurchaseRequestAPI.al)，URL 由 `APIPublisher / APIGroup / APIVersion / EntitySetName` 自動產生。
