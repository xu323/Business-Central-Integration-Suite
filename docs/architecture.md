# 系統架構（Architecture）

## 1. 高層級拓樸

```
              ┌──────────────────────────────────────────────┐
              │              使用者瀏覽器（員工/主管）         │
              └─────────────────────┬────────────────────────┘
                                    │ HTTPS / JSON
                                    ▼
       ┌────────────────────────────────────────────────────────┐
       │   React + TypeScript + Tailwind  ―  Vite (port 5173)   │
       │   - DashboardPage / RequestListPage / DetailPage / ... │
       │   - 統一 fetch 入口：src/lib/api.ts                     │
       └─────────────────────┬──────────────────────────────────┘
                             │ /api/...
                             ▼
       ┌────────────────────────────────────────────────────────┐
       │   FastAPI + SQLAlchemy 2.0 + Pydantic v2 (port 8000)   │
       │   ┌──────────────────────────────────────────────────┐ │
       │   │  Routers                                         │ │
       │   │   • purchase_requests.py  (CRUD + state machine) │ │
       │   │   • audit_logs.py                                │ │
       │   │   • dashboard.py                                 │ │
       │   ├──────────────────────────────────────────────────┤ │
       │   │  Audit                                           │ │
       │   │   • app/audit.py: write_audit() 統一入口          │ │
       │   ├──────────────────────────────────────────────────┤ │
       │   │  BusinessCentralClient (services/)               │ │
       │   │   • mock  → 內建假回覆                            │ │
       │   │   • real  → Entra ID OAuth + BC Custom API        │ │
       │   └──────────────────────────────────────────────────┘ │
       └─────────────┬──────────────────────────┬───────────────┘
                     │                          │
                     ▼                          ▼
       ┌─────────────────────────┐   ┌────────────────────────┐
       │ PostgreSQL 16 / SQLite  │   │ Microsoft Dynamics 365 │
       │ tables:                 │   │ Business Central       │
       │  • purchase_requests    │   │  AL Extension          │
       │  • purchase_request_*   │   │  (extensions/bc-...)   │
       │  • audit_logs           │   │  Object IDs 50100–50199│
       └─────────────────────────┘   └────────────────────────┘
```

## 2. 程式碼結構對照

| 區塊 | 主要檔案 | 角色 |
|------|---------|------|
| AL state machine | [`extensions/bc-procurement/src/codeunits/ApprovalMgt.al`](../extensions/bc-procurement/src/codeunits/ApprovalMgt.al) | 在 BC 端的核准狀態機 |
| API state machine | [`apps/api/app/routers/purchase_requests.py`](../apps/api/app/routers/purchase_requests.py) | 對外整合層的同一套狀態機 |
| BC API connector | [`apps/api/app/services/business_central_client.py`](../apps/api/app/services/business_central_client.py) | mock / real 切換點 |
| Audit | [`apps/api/app/audit.py`](../apps/api/app/audit.py) + `models.py:AuditLog` | 每筆狀態變更必寫一筆稽核 |
| Frontend API client | [`apps/web/src/lib/api.ts`](../apps/web/src/lib/api.ts) | 唯一允許呼叫後端的入口 |

## 3. 狀態機

```
   create
      │
      ▼
 ┌────────┐  submit  ┌──────────┐  approve  ┌──────────┐  sync   ┌────────┐
 │ Draft  │─────────▶│Submitted │─────────▶│ Approved │────────▶│ Synced │
 └────────┘          └──────────┘          └──────────┘         └────────┘
                          │
                          │ reject
                          ▼
                     ┌──────────┐
                     │ Rejected │
                     └──────────┘
```

對應實作：
- AL：[`ApprovalMgt.al`](../extensions/bc-procurement/src/codeunits/ApprovalMgt.al) `SubmitForApproval / Approve / Reject`、[`BCSyncMgt.al`](../extensions/bc-procurement/src/codeunits/BCSyncMgt.al) `SyncRequestToPurchaseOrder`
- Python：[`purchase_requests.py:submit_request / approve_request / reject_request / sync_to_bc`](../apps/api/app/routers/purchase_requests.py)

## 4. 資料模型

### 4.1 Backend（PostgreSQL/SQLite）

```sql
purchase_requests (
  id                UUID  PK,
  number            TEXT  UNIQUE,
  description       TEXT,
  requester         TEXT,
  department        TEXT,
  vendor_no         TEXT,
  vendor_name       TEXT,
  document_date     TIMESTAMP,
  required_date     TIMESTAMP NULL,
  currency_code     TEXT,
  status            ENUM(Draft|Submitted|Approved|Rejected|Synced),
  total_amount      FLOAT,
  high_risk         BOOL,
  approver          TEXT,
  approval_comment  TEXT,
  submitted_at      TIMESTAMP NULL,
  decided_at        TIMESTAMP NULL,
  bc_document_id    TEXT,
  synced_at         TIMESTAMP NULL,
  created_at        TIMESTAMP,
  updated_at        TIMESTAMP
)

purchase_request_lines (
  id            UUID PK,
  request_id    UUID FK → purchase_requests(id) ON DELETE CASCADE,
  line_no       INT,
  item_no       TEXT,
  description   TEXT,
  quantity      FLOAT,
  unit_of_measure TEXT,
  unit_price    FLOAT,
  line_amount   FLOAT
)

audit_logs (
  id              UUID PK,
  timestamp       TIMESTAMP,
  actor           TEXT,
  action          TEXT,        -- create | submit | approve | reject | sync | delete
  target_type     TEXT,        -- 'PurchaseRequest'
  target_id       UUID,
  sync_status     ENUM(Pending|Success|Failed),
  request_payload TEXT,        -- JSON
  response_payload TEXT,       -- JSON
  error_message   TEXT
)
```

### 4.2 AL（Business Central）

| Object | ID | 用途 |
|--------|----|------|
| Enum `Purchase Request Status` | 50100 | 狀態 |
| Table `Purchase Request Header` | 50100 | 主檔 |
| Table `Purchase Request Line` | 50101 | 明細 |
| Page `Purchase Request List` | 50100 | 清單 |
| Page `Purchase Request Card` | 50101 | 卡片 |
| Page `Purchase Request Subform` | 50102 | 子表單 |
| Page (API) `Purchase Request API` | 50180 | 對外 OData API |
| Codeunit `Approval Mgt.` | 50100 | 核心狀態機 |
| Codeunit `BC Sync Mgt.` | 50101 | 轉 PO |
| Codeunit `Purchase Request Tests` | 50190 | 測試 |

## 5. 部署形態

| 模式 | 說明 |
|------|------|
| Local dev | uvicorn + vite，SQLite |
| Docker compose | api + web + postgres |
| Cloud（建議） | API → Azure App Service / Container Apps；DB → Azure Database for PostgreSQL；Web → Azure Static Web Apps；BC → 真實 BC SaaS Tenant |

## 6. 真實 BC 串接

`BC_MODE=real` 時：

1. `BusinessCentralClient._get_token()` 用 client_credentials 向 `login.microsoftonline.com/{tenant}/oauth2/v2.0/token` 申請 token，scope `https://api.businesscentral.dynamics.com/.default`。
2. 用 Bearer token 呼叫 BC Custom API：
   ```
   POST {bc_base_url}/{tenant}/{environment}/api/{publisher}/{group}/{version}/companies({company})/purchaseRequests
   ```
3. 回傳的 `number` / `id` 寫入 `purchase_requests.bc_document_id`，並把 `status` 推進到 `Synced`。
4. 同步失敗：寫一筆 `sync_status=Failed` 的 audit log，前端會在 Dashboard / Audit Logs 顯示。

## 7. 為什麼要拆「BC 端 AL」 + 「外部整合 API」

| 原因 | 說明 |
|------|------|
| **多系統整合** | 真實 MSP 場景常需要外部 ERP（如本專案的 FastAPI 模擬）整併多個來源後再寫回 BC。AL 端只負責「我能接受什麼」。 |
| **解耦** | AL Extension 的部署受 BC tenant 排程限制；外部整合層可以獨立 deploy。 |
| **可測試** | mock connector 讓 CI 可以跑端對端測試而不需要 BC sandbox。 |
| **權責清楚** | AL 的 codeunit 守 BC 業務一致性；FastAPI 守跨系統流程一致性。 |
