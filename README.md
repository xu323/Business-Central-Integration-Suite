# Business Central Integration Suite

> **Microsoft Dynamics 365 Business Central / Navision 系統開發工程師作品集**
> 一個端到端的「採購／請購／財務核准 + Business Central 整合」MSP 服務商示範方案。

[![CI](https://github.com/xu323/Business-Central-Integration-Suite/actions/workflows/ci.yml/badge.svg)](https://github.com/xu323/Business-Central-Integration-Suite/actions/workflows/ci.yml)

---

## 一、這個專案在做什麼

模擬 MSP（Managed Service Provider）服務商為一家中型企業導入 **Microsoft Dynamics 365 Business Central**，並圍繞 **Purchase Request → Approval → Sync to BC** 流程，產出一整套可被面試展示的完整解決方案：

| 模組 | 內容 | 對應位置 |
|------|------|----------|
| AL Extension | Purchase Request Header / Line、Approval Codeunit、API Page、Test Codeunit | [`extensions/bc-procurement/`](extensions/bc-procurement/) |
| API Integration Hub | FastAPI 後端，REST API、SQL Audit Log、BC Mock/Real Connector | [`apps/api/`](apps/api/) |
| Operations Dashboard | React + TypeScript + Tailwind 企業級 SaaS 風格 UI | [`apps/web/`](apps/web/) |
| CI / Docker | GitHub Actions 五個工作、Multi-stage Dockerfile、docker-compose | [`.github/workflows/ci.yml`](.github/workflows/ci.yml) |
| 技術文件 | 中文使用方法、架構、API、安全、面試引導 | [`docs/`](docs/) |
| 多 Agent 設定 | 7 個專業角色 + 6 個 Skill 定義給 Claude Code | [`.claude/`](.claude/) |

---

## 二、為什麼這個專案符合 Dynamics 365 BC 系統開發工程師職缺

| 職缺常見要求 | 此專案如何展示 |
|-------------|---------------|
| Dynamics 365 Business Central / NAV 系統客製 | `extensions/bc-procurement/` 完整 AL Extension（Table、Page、Codeunit、Enum、API Page、Test Codeunit） |
| AL 程式語言、Object 編號規劃 | 全部 Object 落在 50100–50199 Per Tenant Extension 範圍 |
| BC API（OData / Custom API）與外部系統整合 | `apps/api/app/services/business_central_client.py` 同時支援 mock 與 real OAuth 模式 |
| 採購、請購、財務、核准流程 | Draft → Submitted → Approved/Rejected → Synced 完整生命週期，前後端同步 |
| SQL 資料庫、稽核紀錄 | `AuditLog` 表 + 每個狀態變更都寫稽核 |
| 系統文件撰寫能力 | `docs/architecture.md`、`docs/api.md`、`使用方法.md` |
| DevOps（Git、CI/CD、Docker） | GitHub Actions 5 jobs + 兩個多階段 Dockerfile + docker-compose |
| 顧問溝通 / 客戶導入經驗 | MSP 情境包裝、interview-guide.md 已整理面試話術 |

---

## 三、架構總覽

```
┌──────────────────────────────────────────────────────────────────┐
│                  React + Tailwind Dashboard (5173)               │
│   Pages: Dashboard / Requests / Detail / Create / Audit Logs    │
└────────────────────────┬─────────────────────────────────────────┘
                         │ JSON over HTTP
                         ▼
┌──────────────────────────────────────────────────────────────────┐
│            FastAPI + SQLAlchemy + Pydantic v2 (8000)             │
│   Routers: purchase_requests / audit_logs / dashboard            │
│   Audit  : every state change → AuditLog table                   │
└──────┬─────────────────────────────────────────┬─────────────────┘
       │                                          │
       ▼                                          ▼
┌──────────────────┐                ┌──────────────────────────────┐
│  PostgreSQL /    │                │   BusinessCentralClient      │
│  SQLite          │                │   ┌──────────────────────┐   │
│  (purchase_*,    │                │   │ mock (default)       │   │
│   audit_logs)    │                │   │ real (Entra ID OAuth │   │
│                  │                │   │       client_creds)  │   │
└──────────────────┘                │   └──────────────────────┘   │
                                    └──────────────┬───────────────┘
                                                   │
                                                   ▼
                                    ┌──────────────────────────────┐
                                    │  AL Extension                │
                                    │  (Per-Tenant 50100–50199)    │
                                    │  Tables / Codeunits / API    │
                                    │  Page / Test Codeunit        │
                                    └──────────────────────────────┘
```

詳見 [`docs/architecture.md`](docs/architecture.md)。

---

## 四、技術棧

| 層 | 技術 |
|----|------|
| AL Extension | AL Language 12.0 (BC v23+), Per-Tenant Extension |
| Backend | Python 3.11, FastAPI 0.115, SQLAlchemy 2.0, Pydantic v2, httpx, ruff, pytest |
| Frontend | React 18, TypeScript 5.6, Vite 5, Tailwind 3.4, react-router 6 |
| 資料庫 | SQLite (預設零設定) / PostgreSQL 16 (docker-compose) |
| CI/CD | GitHub Actions × 5 jobs (backend, frontend, docker, docs, AL validation) |
| 容器化 | Docker multi-stage、nginx static serving |
| 認證 | Microsoft Entra ID (Azure AD) Client Credentials Flow |

---

## 五、快速啟動（Mock 模式，零外部相依）

> 詳細逐步教學：請看 [`使用方法.md`](使用方法.md)。

```powershell
# 1. 一鍵安裝
.\scripts\init-dev.ps1

# 2. 啟動 backend
cd apps\api
.\.venv\Scripts\Activate.ps1
uvicorn app.main:app --reload

# 3. 另開 terminal 啟動 frontend
cd apps\web
npm run dev

# 4. 開瀏覽器
#   - http://localhost:5173/        前端
#   - http://localhost:8000/docs    Swagger
```

或直接用 Docker：

```powershell
docker compose up --build
```

---

## 六、Demo 流程（面試現場 5 分鐘版本）

1. 打開 `http://localhost:5173/`，展示 Dashboard 已有 4 筆 seed data。
2. 點 `➕ New Request`，建立一筆金額 250,000 的請購單。
3. 系統自動標記 **High-Risk**。
4. 進入詳情頁，按 **Submit** → **Approve** → **Sync to Business Central**。
5. 切到 Audit Logs：可看到 4 筆事件（create / submit / approve / sync），同步成功的 BC Document ID 會顯示為 `PO-MOCK-PR…`。
6. 切到 Swagger (`/docs`)，展示同樣流程的 OpenAPI 介面。
7. 切到 VS Code，打開 `extensions/bc-procurement/src/codeunits/ApprovalMgt.al`，解釋同樣的狀態機在 AL 端的對應實作。

---

## 七、CI/CD

GitHub Actions ([`.github/workflows/ci.yml`](.github/workflows/ci.yml)) 在 push / PR 時跑：

| Job | 內容 |
|-----|------|
| `backend-ci` | ruff lint + pytest（含 coverage） |
| `frontend-ci` | tsc typecheck + ESLint + vite build |
| `docker-build` | Build API + Web 鏡像（不推送） |
| `docs-check` | 確認 README / 使用方法 / docs/* 等必要文件存在 |
| `al-validation` | 驗證 `app.json` schema + AL 檔案語法（advisory；GitHub-hosted runner 無法跑 alc.exe） |

---

## 八、未來擴充

- [ ] 接入真實 BC Sandbox：填好 `.env` 的 `BC_TENANT_ID/CLIENT_ID/CLIENT_SECRET/COMPANY_ID` 並切 `BC_MODE=real`。
- [ ] AL Extension 中將 `BCSyncMgt` 內 `// Real BC integration` 區塊解除註解，串接 `Purchase Header`、`Purchase Line` 寫入。
- [ ] 接入 Microsoft Power BI / Azure Application Insights 監控。
- [ ] 加入電子郵件 / Teams 通知（`Workflow Webhook` 訂閱）。
- [ ] 角色權限：FastAPI 加上 `fastapi-azure-auth` 或 OIDC middleware。

---

## 九、文件索引

- [`使用方法.md`](使用方法.md) — 新手向逐步教學
- [`docs/architecture.md`](docs/architecture.md) — 系統架構
- [`docs/api.md`](docs/api.md) — REST API 文件
- [`docs/research-notes.md`](docs/research-notes.md) — Microsoft 官方文件研究筆記
- [`docs/security-notes.md`](docs/security-notes.md) — 安全 / 上線檢查清單
- [`docs/interview-guide.md`](docs/interview-guide.md) — 面試講解腳本

---

## License

MIT — see header in source files. This is a portfolio project; no production warranty.
