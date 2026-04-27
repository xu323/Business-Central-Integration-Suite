# 專案導覽

> 給第一次接觸這個 repo 的工程師閱讀。先用三段式摘要交代「這是什麼 / 怎麼跑 / 哪裡看程式」，
> 然後把常見的設計問題與對應檔案列出來，方便快速定位。

---

## 1. 一段話摘要

**Business Central Integration Suite** 是一個圍繞 **Purchase Request → Approval → Sync to Business Central** 流程的端到端整合系統：AL Extension 做 BC 端的物件、核准流程、Custom API；外部以 FastAPI 作為整合中樞，可在無 BC sandbox 時以 mock connector 運行，亦可切換為真實 BC OAuth 模式；前端是 React + Tailwind 的營運 Dashboard，CI/CD 五個 Job + GHCR 推送。

## 2. 五分鐘 Demo 流程

1. 打開 `http://localhost:5173/`，**Dashboard**：Seed data 4 筆，分別是 Draft / Submitted / Approved / Synced。
2. 進入 **Purchase Requests** 列表 → 點 **➕ New Request**：建立一筆金額 250,000 的請購單，會自動標記 `high_risk = true`（門檻 100,000）。
3. 詳情頁右側 Workflow Actions：**Submit → Approve → Sync to Business Central**；狀態 badge 會跟著變色（灰 → 黃 → 綠 → 藍）。
4. **Audit Logs** 頁：每筆狀態變更都寫入 `audit_logs` 表，含 `actor / action / sync_status / error_message`。Sync 成功會看到 mock 的 `PO-MOCK-PR…` ID。
5. 切到 Swagger `/docs`：同一組 API 由 OpenAPI 自動產出互動式介面。
6. 切到 [`extensions/bc-procurement/src/codeunits/ApprovalMgt.al`](../extensions/bc-procurement/src/codeunits/ApprovalMgt.al)：BC 端核心 codeunit，狀態機與 [`apps/api/app/routers/purchase_requests.py`](../apps/api/app/routers/purchase_requests.py) 完全對應。

---

## 3. 設計問答（FAQ 形式的設計筆記）

### Q1：AL Object 編號規劃

Per Tenant Extension 的範圍是 50000–99999，本專案集中在 50100–50199。Enum、Table、Codeunit 各從 50100 起跳；API Page 跳到 50180（避開普通 Page 編號）；Test Codeunit 放最後 50190 方便辨識。

### Q2：為什麼 BC API Page 之外還要再做一個 FastAPI？

實務上常需要把多個來源的請購（內部表單、Email、外部供應商）統一規整後再寫回 BC。BC 的 API Page 只負責「我願意接受什麼」；FastAPI 是「整合與防腐層」，可以做 audit log、retry、mock 測試，跟 BC 的部署排程也解耦。

### Q3：沒接真實 BC 時如何驗證流程？

兩件事：
1. `BusinessCentralClient` 的 mock / real 兩條路是同一個介面（`sync_purchase_request(payload)`），mock 模式產生與 BC 一樣形狀的 response（`@odata.context`、`number`、`vendorNumber`、`status`）。
2. AL 端 `PurchaseRequestAPI.al` 是真實的 API Page 寫法，URL 由 BC 自動產生為 `…/api/xu323/integration/v1.0/companies(...)/purchaseRequests`，有 sandbox 直接 publish 即可運作。

### Q4：High-Risk 門檻怎麼定？

透過 `.env` 的 `HIGH_RISK_THRESHOLD`，預設 100,000。AL 端 `Approval Mgt.IsHighRisk()` 也讀同樣的概念。生產環境通常會跟 BC 的 User Setup → Approval Limit 對齊，做成跟使用者角色綁定的動態門檻。

### Q5：審計日誌（Audit Log）為什麼單獨建表，而不是直接看 BC Change Log？

BC 的 Change Log 只能看到 BC 內部欄位變動。這套整合流程跨多個系統（前端、API、BC、Email 通知），所以需要一張 cross-system 的 audit。`audit_logs` 在每個 router 寫一筆 (`create / submit / approve / reject / sync / delete`)，包含 request / response payload，便於追蹤同步失敗時到底是哪一步出問題。

### Q6：怎麼接真實的 BC sandbox？

三件事：
1. Azure Portal 建一個 Entra ID App Registration，授予 `Dynamics 365 Business Central` Application permission，admin consent。
2. BC 內 `Microsoft Entra Applications` 頁面綁定 App Id，指派 PermissionSet。
3. `.env` 填 `BC_MODE=real`、`BC_TENANT_ID / CLIENT_ID / CLIENT_SECRET / COMPANY_ID`，重啟 backend。

之後再按 Sync to BC，請求就會走真實 OAuth + BC Custom API。詳細步驟在 [`docs/architecture.md`](architecture.md) §6。

### Q7：沒有 BC sandbox 的情況下怎麼確保 AL 程式碼品質？

1. 每個物件遵守 Object 編號規劃 + `DataClassification`。
2. 七個 Test Codeunit 用 GIVEN / WHEN / THEN 模式覆蓋核心狀態機。
3. CI 有一個 `al-validation` job：解析 `app.json` schema、檢查 idRanges、AL 檔案開頭格式。
4. 真要 compile 仍需進 BC sandbox 或 AL-Go-Actions（[`docs/research-notes.md`](research-notes.md) §6 已說明限制）。

### Q8：CI / CD 兩個 workflow 的職責分工？

- **CI** (`.github/workflows/ci.yml`)：backend-ci（ruff + pytest）、frontend-ci（tsc + ESLint + vite build）、docker-build（兩個鏡像 build 不推送）、docs-check、al-validation。
- **CD** (`.github/workflows/release.yml`)：push 到 main / 推 `v*.*.*` tag / 手動觸發時，把 API + Web 兩個 image 推到 GHCR。

### Q9：安全考量

詳見 [`docs/security-notes.md`](security-notes.md)。重點：
- 所有 BC secret 從 `.env` 注入，永遠不進版本控制。
- SQLAlchemy ORM，沒有字串拼接 SQL。
- CORS allowlist，不是 `*`。
- 上線清單包含 Azure Key Vault、Entra ID JWT、API Management Rate Limiting。

### Q10：最關鍵的設計取捨

把「狀態機在 AL 跟 FastAPI 各做一份」。實務上很容易把 BC 端做薄、邏輯都丟外部，但這會讓 BC 內部報表（例如 BC 報 P&L 時）對不上同步狀態。本專案兩端都用同樣的 enum + 同樣的轉移規則，再用 audit log 驗證雙寫一致。

---

## 4. 主題 → 檔案快速定位

| 主題 | 檔案 |
|------|------|
| AL 開發 | [`extensions/bc-procurement/src/codeunits/ApprovalMgt.al`](../extensions/bc-procurement/src/codeunits/ApprovalMgt.al) |
| BC API（OData / Custom API） | [`extensions/bc-procurement/src/api/PurchaseRequestAPI.al`](../extensions/bc-procurement/src/api/PurchaseRequestAPI.al) |
| 採購／請購／核准流程 | [`apps/api/app/routers/purchase_requests.py`](../apps/api/app/routers/purchase_requests.py) |
| SQL / Audit | [`apps/api/app/models.py`](../apps/api/app/models.py)、[`apps/api/app/audit.py`](../apps/api/app/audit.py) |
| 系統整合（mock / real BC connector） | [`apps/api/app/services/business_central_client.py`](../apps/api/app/services/business_central_client.py) |
| 前端 / Dashboard | [`apps/web/src/pages/DashboardPage.tsx`](../apps/web/src/pages/DashboardPage.tsx) |
| 多語系（zh-TW / en / ja） | [`apps/web/src/i18n/index.ts`](../apps/web/src/i18n/index.ts) |
| CI / CD / Docker | [`.github/workflows/ci.yml`](../.github/workflows/ci.yml)、[`.github/workflows/release.yml`](../.github/workflows/release.yml) |
| 系統文件 | [`使用方法.md`](../使用方法.md)、[`docs/research-notes.md`](research-notes.md) |
| 安全 / 上線 checklist | [`docs/security-notes.md`](security-notes.md) |

---

## 5. 與導入團隊對齊時可釐清的問題

- 目標 BC 環境是 SaaS 還是 On-Prem？mock connector 切到 real 是否需要不同的 endpoint？
- 團隊使用 AL-Go-Actions、Power Platform CICD，還是自架 BC Container？
- Approval workflow 走 BC 內建還是 Power Automate？本專案 Codeunit 預留了 `IntegrationEvent`，可對應現有訂閱機制。
