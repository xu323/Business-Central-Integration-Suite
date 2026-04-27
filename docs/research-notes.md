# Microsoft Dynamics 365 Business Central 開發研究筆記

> 本文件由 **Microsoft BC Research Agent** 產出，供 AL Extension Engineer Agent 與 Backend Integration Engineer Agent 作為實作依據。
> 所有資訊均來自 Microsoft Learn 官方文件 (`learn.microsoft.com/dynamics365/business-central/dev-itpro/`) 與 AL Language Reference。
> 此筆記同時作為設計決策追溯依據：當 BC 標準做法與本專案簡化做法不同時，會明確標示原因。

---

## 1. Business Central 是什麼

Microsoft Dynamics 365 Business Central（簡稱 **BC**）是 Microsoft 為中小企業提供的雲端 ERP，前身為 **Microsoft Dynamics NAV (Navision)**。

主要模組：

| 模組 | 中文 | 對應 Table 範例 |
|------|------|----------------|
| Finance | 財務 | G/L Entry, G/L Account |
| Sales & Receivables | 銷售與應收 | Sales Header, Sales Line, Customer |
| Purchases & Payables | 採購與應付 | Purchase Header, Purchase Line, Vendor |
| Inventory | 庫存 | Item, Item Ledger Entry |
| Manufacturing | 製造 | Production Order |
| Project | 專案 | Job, Job Task |
| Human Resources | 人資 | Employee |

本專案聚焦於 **Purchases & Payables（採購與應付）** 中的「請購單 → 採購核准 → Purchase Order 同步」流程。

---

## 2. AL 語言核心概念

AL（Application Language）是 BC 專用語言，文法接近 Pascal。AL 物件類型：

| 物件類型 | 用途 | 編號範圍（Per Tenant Extension 建議） |
|----------|------|--------------------------------------|
| `table` | 資料表 | 50000–99999 |
| `tableextension` | 擴充標準 Table | 50000–99999 |
| `page` | 畫面 | 50000–99999 |
| `pageextension` | 擴充標準 Page | 50000–99999 |
| `report` | 報表 | 50000–99999 |
| `codeunit` | 商業邏輯 | 50000–99999 |
| `enum` | 列舉值 | 50000–99999 |
| `enumextension` | 擴充標準 Enum | 50000–99999 |
| `query` | 查詢 | 50000–99999 |
| `xmlport` | XML 匯入匯出 | 50000–99999 |
| `permissionset` | 權限集 | — |

> **重要**：50000–99999 是 Per Tenant Extension 範圍；本專案使用 50100–50199。
> 真正要上 AppSource 的 ISV 需向 Microsoft 申請 ID 範圍。

### 2.1 Table 範例語法

```al
table 50100 "Purchase Request Header"
{
    DataClassification = CustomerContent;

    fields
    {
        field(1; "No."; Code[20]) { Caption = 'No.'; }
        field(10; "Requester"; Code[50]) { Caption = 'Requester'; }
        field(20; "Status"; Enum "Purchase Request Status") { Caption = 'Status'; }
    }

    keys
    {
        key(PK; "No.") { Clustered = true; }
    }
}
```

### 2.2 Page 類型

- `Card`：單筆編輯頁
- `List`：清單頁
- `ListPart` / `CardPart`：嵌入其他 Page 的子頁
- `RoleCenter`：角色中心
- `API`：對外 RESTful 端點（OData v4 over HTTP）

### 2.3 Codeunit

Codeunit 是 AL 的「無 UI 業務邏輯容器」，相當於 service layer。常見模式：

- 一個 codeunit 一個職責（例：`Approval Mgt.`、`Document Posting`）
- 用 `[EventSubscriber]` 訂閱平台事件，避免修改原 Microsoft 程式碼
- `[IntegrationEvent]` 自行發布事件，給其他 Extension 訂閱

### 2.4 Test Codeunit

```al
codeunit 50190 "Purchase Request Tests"
{
    Subtype = Test;
    TestPermissions = Disabled;

    [Test]
    procedure CanSubmitDraftRequest()
    begin
        // GIVEN
        // WHEN
        // THEN
    end;
}
```

跑測試的工具：**AL Test Runner**（VS Code Extension）或 **BC Container Helper**（PowerShell）。

---

## 3. Business Central API（OData v4）

BC 提供兩種 API：

### 3.1 標準 API（v2.0）

URL 格式：
```
https://api.businesscentral.dynamics.com/v2.0/{tenantId}/{environment}/api/v2.0/companies({companyId})/purchaseInvoices
```

### 3.2 Custom API（透過 AL `page` 類型 = `API`）

```al
page 50180 "Purchase Request API"
{
    PageType = API;
    APIPublisher = 'xu323';
    APIGroup = 'integration';
    APIVersion = 'v1.0';
    EntityName = 'purchaseRequest';
    EntitySetName = 'purchaseRequests';
    SourceTable = "Purchase Request Header";
    DelayedInsert = true;
    ODataKeyFields = SystemId;
}
```

URL 會變成：
```
https://api.businesscentral.dynamics.com/v2.0/{tenantId}/{env}/api/xu323/integration/v1.0/companies({companyId})/purchaseRequests
```

### 3.3 認證

- **OAuth 2.0 / Microsoft Entra ID（Azure AD）**：正式環境唯一推薦
- **Web Service Access Key（已棄用）**：僅 OnPrem
- **Service-to-Service (S2S)**：Server App + Client Credentials Flow，本專案 production 模式採此

需要在 Entra ID 註冊 App，授予 BC 權限：`Financials.ReadWrite.All` 或 `app_access`，並在 BC 內透過頁面 **Microsoft Entra Applications**（page 9087）綁定 App ID 並指派 PermissionSet。

---

## 4. Approval Workflow（核准流程）

BC 內建 **Approval** 框架：

| Table | 用途 |
|-------|------|
| `Approval Entry` (table 454) | 每筆核准請求 |
| `Workflow` (table 1501) | 流程定義 |
| `Workflow Step Instance` (table 1504) | 流程執行實例 |
| `User Setup` (table 91) | 主管 / 金額限額 |

關鍵 Codeunit：

- `Approvals Mgmt.` (codeunit 1535)
- `Workflow Webhook Mgt.` (codeunit 1543)

核准事件：
- `OnSendPurchaseDocForApproval`
- `OnCancelPurchaseApprovalRequest`
- `OnApproveRequestsForRecord`

本專案的 `Approval Mgt.` codeunit 採用簡化版自製狀態機以保持自含；本筆記另說明真實 BC Workflow 如何接入。

---

## 5. 開發工具

| 工具 | 用途 |
|------|------|
| **Visual Studio Code** + AL Language Extension | 主要 IDE |
| **AL:Go Extension Wizard** | 建立 AL 專案骨架 |
| **BC Container Helper** (PowerShell module) | 起本地 Docker BC 環境 |
| **AL Test Runner** | VSCode 跑測試 |
| **Dynamics 365 Business Central Sandbox** | 雲端測試環境（免費） |
| **Postman / REST Client** | 測 API |

VS Code 編譯 AL：`Ctrl+Shift+B` → 產生 `.app` 檔，再透過 `Publish` 上傳到 BC。

---

## 6. 為何 GitHub Actions 不能直接 compile AL

`alc.exe`（AL Compiler）需要：
1. AL Language VS Code Extension（封裝 alc.exe）
2. BC Symbol（從 BC server 下載 .app 符號檔）

GitHub-hosted runner 沒有這兩者；必須透過 [microsoft/AL-Go-Actions](https://github.com/microsoft/AL-Go-Actions) 或自架 BC Container 的 self-hosted runner。

**本專案策略**：
- CI 中設置 `optional-al-validation` job：用簡單 regex / parser 驗證 `app.json` 與 AL 語法格式（不真的 compile）
- README 註明限制，並指引讀者如何用本機 BC sandbox 真正編譯

---

## 7. 設計決策對應

| 需求 | BC 真實做法 | 本專案實作 | 為何這樣設計 |
|------|------------|-----------|------------|
| 採購請購單 | Purchase Quote / Requisition | 自定 `Purchase Request Header/Line` | 避開複雜 BC 標準表結構，但保留同樣概念 |
| 核准 | Workflow + Approval Entry | 簡化狀態機 + Audit Log | 在不依賴 BC sandbox 的情況下可獨立展示完整生命週期 |
| 同步至 BC | 將 Approved Request 透過 Custom API 寫入，最後手動轉 PO | Mock connector + 真實 API 切換點 | 沒有 sandbox 也能 demo |
| 高金額審核 | User Setup 中的 Approval Limit | 後端 `HIGH_RISK_THRESHOLD` 環境變數 | 同樣概念，更易解釋 |

---

## 8. 實作 Checklist

- [x] AL 物件 ID 落在 50100–50199
- [x] Table 必有 `DataClassification`
- [x] Page API 必須有 `APIPublisher / APIGroup / APIVersion`
- [x] Codeunit 公開 procedure 加上中英對照註解
- [x] Test Codeunit 用 `[Test]` + GIVEN/WHEN/THEN 模式
- [x] FastAPI 端模擬 OAuth header（`Bearer mock-token`）
- [x] 切換真實 BC 只需改 `.env`：`BC_MODE=real` + `BC_TENANT_ID` + `BC_CLIENT_ID` + `BC_CLIENT_SECRET`

---

## 9. 參考資料來源

- AL Language Reference — `learn.microsoft.com/dynamics365/business-central/dev-itpro/developer/devenv-programming-in-al`
- Object Numbering — `learn.microsoft.com/dynamics365/business-central/dev-itpro/developer/devenv-extension-example`
- Custom API — `learn.microsoft.com/dynamics365/business-central/dev-itpro/developer/devenv-develop-custom-api`
- Service-to-Service Auth — `learn.microsoft.com/dynamics365/business-central/dev-itpro/administration/automation-apis-using-s2s-authentication`
- Approval Workflow — `learn.microsoft.com/dynamics365/business-central/across-how-use-workflows`
- AL Test Framework — `learn.microsoft.com/dynamics365/business-central/dev-itpro/developer/devenv-testing-application`
