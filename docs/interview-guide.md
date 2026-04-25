# 面試講解腳本

> 給「Dynamics 365 Business Central 系統開發工程師」職缺面試使用。
> 假設面試官會問：「你做的這個專案大概是什麼？我可以怎麼看？」

---

## 1. 30 秒電梯版

> 「我做了一個 **Business Central Integration Suite**，模擬 MSP 服務商替企業導入 BC 的端到端方案。AL Extension 端做了完整的 Purchase Request 物件、核准流程跟 Custom API；外部用 FastAPI 當整合中樞，可以無 BC sandbox 用 mock connector 跑、也能切真實 BC OAuth 模式。前端是 React + Tailwind 企業 Dashboard，CI 五個 Job 全綠，有 Audit Log、繁中使用文件。」

## 2. 5 分鐘現場 Demo 流程

1. 打開 `http://localhost:5173/`，**Dashboard**：
   > 「Seed data 4 筆，分別是 Draft / Submitted / Approved / Synced，模擬一家公司一週的請購狀態。」
2. 進入 **Purchase Requests** 列表 → 點 **➕ New Request**：
   > 「我建立一筆金額 250,000 的請購單，故意超過 100,000 的 high-risk 門檻。」
3. 詳情頁右側 Workflow Actions：
   > 「Submit → Approve → Sync to Business Central。」
   > 「狀態 badge 會跟著變色：灰 → 黃 → 綠 → 藍。」
4. **Audit Logs** 頁：
   > 「每筆狀態變更都寫進 `audit_logs` 表，包含 actor / action / sync_status / error_message。Sync 成功會看到 mock 的 `PO-MOCK-PR…` ID。」
5. 切到 Swagger `/docs`：
   > 「同一個 API 我也用 OpenAPI 自動產生互動式文件，BC 顧問可以自己試。」
6. 切到 VS Code，打開 [`extensions/bc-procurement/src/codeunits/ApprovalMgt.al`](../extensions/bc-procurement/src/codeunits/ApprovalMgt.al)：
   > 「這是 BC 端的核心 codeunit，狀態機跟 FastAPI 的 [`apps/api/app/routers/purchase_requests.py`](../apps/api/app/routers/purchase_requests.py) 完全對應，故意做成兩端各一份來示範整合層的雙寫一致性。」

---

## 3. 預期被問到的問題（含示意答案）

### Q1：你怎麼決定這些 AL Object 的編號？

> Per Tenant Extension 的範圍是 50000–99999，我把這個專案集中在 50100–50199。Enum、Table、Codeunit 各從 50100 起跳；API Page 跳到 50180 是慣例（避開普通 Page）；Test Codeunit 放最後 50190 方便辨識。

### Q2：為什麼有了 BC API Page，還要再做一個 FastAPI？

> 因為實務上 MSP 客戶常需要把多個來源的請購（內部表單、Email、外部供應商）統一規整後再寫回 BC。BC 的 API Page 只負責「我願意接受什麼」；FastAPI 是「整合與防腐層」，可以做 audit log、retry、mock 測試，跟 BC 的部署排程也解耦。

### Q3：沒接真實 BC 怎麼證明這套真的能跑？

> 兩件事：
> 1. `BusinessCentralClient` 的 mock / real 兩條路是同一個介面（`sync_purchase_request(payload)`），mock 模式產生與 BC 一樣形狀的 response（`@odata.context`、`number`、`vendorNumber`、`status`）。
> 2. AL 端 `PurchaseRequestAPI.al` 是真實的 API Page 寫法，URL 由 BC 自動產生為 `…/api/xu323/integration/v1.0/companies(...)/purchaseRequests`，如果有 sandbox 直接 publish 上去就能 work。

### Q4：High-Risk 門檻怎麼定？

> 透過 `.env` 的 `HIGH_RISK_THRESHOLD`，預設 100,000。AL 端 `Approval Mgt.IsHighRisk()` 也讀同樣的概念。生產環境通常會跟 BC 的 User Setup → Approval Limit 對齊，做成跟使用者角色綁定的動態門檻。

### Q5：審計日誌（Audit Log）為什麼要單獨建一張表，而不是直接看 BC 的 Change Log？

> BC 的 Change Log 只能看到 BC 內部欄位變動。我們的整合流程跨多個系統（前端、API、BC、Email 通知），所以需要一張 cross-system 的 audit。`audit_logs` 在每個 router 寫一筆 (`create / submit / approve / reject / sync / delete`)，包含 request / response payload，便於追蹤同步失敗時到底是哪一步出問題。

### Q6：怎麼接真實的 BC sandbox？

> 三件事：
> 1. Azure Portal 建一個 Entra ID App Registration，授予 `Dynamics 365 Business Central` Application permission，admin consent。
> 2. BC 內 `Microsoft Entra Applications` 頁面綁定 App Id，指派 PermissionSet。
> 3. `.env` 填 `BC_MODE=real`、`BC_TENANT_ID / CLIENT_ID / CLIENT_SECRET / COMPANY_ID`，重啟 backend。
> 之後再按 Sync to BC，請求就會走真實 OAuth + BC Custom API。詳細步驟在 [`docs/architecture.md`](architecture.md) §6。

### Q7：你怎麼確保 AL 程式碼品質（沒有 BC sandbox 的情況）？

> 1. 每個物件遵守 Object 編號規劃 + `DataClassification`。
> 2. 七個 Test Codeunit 用 GIVEN / WHEN / THEN 模式覆蓋核心狀態機。
> 3. CI 有一個 `al-validation` job：解析 `app.json` schema、檢查 idRanges、AL 檔案開頭格式。
> 4. 真要 compile 還是要進 BC sandbox 或 AL-Go-Actions（[`docs/research-notes.md`](research-notes.md) §6 已說明限制）。

### Q8：CI 五個 job 大概怎麼分？

> backend-ci（ruff + pytest）、frontend-ci（tsc + ESLint + vite build）、docker-build（兩個鏡像 build）、docs-check（驗 README/使用方法/docs 都在）、al-validation（advisory，因 GitHub-hosted runner 沒有 alc.exe）。

### Q9：安全性？

> 詳見 [`docs/security-notes.md`](security-notes.md)。核心：
> - 所有 BC secret 從 `.env` 注入，永遠不進版本控制。
> - SQLAlchemy ORM，沒有字串拼接 SQL。
> - CORS allowlist，不是 `*`。
> - 上線清單包含 Azure Key Vault、Entra ID JWT、API Management Rate Limiting。

### Q10：你最有信心的設計決策？

> 把「狀態機在 AL 跟 FastAPI 各做一份」這件事。這在實務上常被混淆——很多人會想把 BC 端做薄、邏輯都丟外部，但這會讓 BC 內部報表（例如 BC 報 P&L 時）對不上同步狀態。所以我兩端都用同樣的 enum + 同樣的轉移規則，再用 audit log 驗證雙寫一致。

---

## 4. 對應職缺常見能力的「快速指引」

| 能力 | 直接打開 |
|------|---------|
| AL 開發 | [`extensions/bc-procurement/src/codeunits/ApprovalMgt.al`](../extensions/bc-procurement/src/codeunits/ApprovalMgt.al) |
| BC API（OData / Custom API） | [`extensions/bc-procurement/src/api/PurchaseRequestAPI.al`](../extensions/bc-procurement/src/api/PurchaseRequestAPI.al) |
| 採購／請購／核准流程 | [`apps/api/app/routers/purchase_requests.py`](../apps/api/app/routers/purchase_requests.py) |
| SQL / Audit | [`apps/api/app/models.py`](../apps/api/app/models.py)、[`apps/api/app/audit.py`](../apps/api/app/audit.py) |
| 系統整合 | [`apps/api/app/services/business_central_client.py`](../apps/api/app/services/business_central_client.py) |
| 前端 / Dashboard | [`apps/web/src/pages/DashboardPage.tsx`](../apps/web/src/pages/DashboardPage.tsx) |
| CI / DevOps | [`.github/workflows/ci.yml`](../.github/workflows/ci.yml) |
| 文件 / 顧問溝通 | [`使用方法.md`](../使用方法.md)、[`docs/research-notes.md`](research-notes.md) |
| 安全 / 上線 | [`docs/security-notes.md`](security-notes.md) |

---

## 5. 你在面試現場可以反問的問題

- 「貴公司的 BC 環境是 SaaS 還是 On-Prem？我這個 mock connector 切換成 real 之後是否要改用不同的 endpoint？」
- 「目前團隊用 AL-Go-Actions、Power Platform CICD，還是自架 BC Container？」
- 「Approval workflow 是用 BC 內建還是 Power Automate？我這邊 Codeunit 預留了 IntegrationEvent，要怎麼接你們現有的訂閱機制？」

---

祝面試順利！🚀
