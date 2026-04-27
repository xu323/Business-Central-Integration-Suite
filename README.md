# Business Central Integration Suite

> **Microsoft Dynamics 365 Business Central** 採購／請購／財務核准 + 外部系統整合的端到端範例專案。
> AL Extension + FastAPI Integration Hub + React Dashboard + 多語系前端 + GHCR CI/CD。

[![CI](https://github.com/xu323/Business-Central-Integration-Suite/actions/workflows/ci.yml/badge.svg)](https://github.com/xu323/Business-Central-Integration-Suite/actions/workflows/ci.yml)
[![Release](https://github.com/xu323/Business-Central-Integration-Suite/actions/workflows/release.yml/badge.svg)](https://github.com/xu323/Business-Central-Integration-Suite/actions/workflows/release.yml)

---

## 一、這個專案在做什麼

以 MSP（Managed Service Provider）替企業導入 **Microsoft Dynamics 365 Business Central** 為情境，圍繞 **Purchase Request → Approval → Sync to BC** 流程，提供一整套可獨立執行的整合解決方案：

| 模組 | 內容 | 對應位置 |
|------|------|----------|
| AL Extension | Purchase Request Header / Line、Approval Codeunit、API Page、Test Codeunit | [`extensions/bc-procurement/`](extensions/bc-procurement/) |
| API Integration Hub | FastAPI 後端，REST API、SQL Audit Log、BC Mock/Real Connector | [`apps/api/`](apps/api/) |
| Operations Dashboard | React + TypeScript + Tailwind 企業級 SaaS 風格 UI（zh-TW / en / ja） | [`apps/web/`](apps/web/) |
| CI / CD / Docker | GitHub Actions × 6 jobs、GHCR publish、Multi-stage Dockerfile、docker-compose | [`.github/workflows/`](.github/workflows/) |
| 技術文件 | 中文使用方法、架構、API、安全、專案導覽 | [`docs/`](docs/) |
| 多 Agent 設定 | 7 個專業角色 + 6 個 Skill 定義給 Claude Code | [`.claude/`](.claude/) |

---

## 二、系統設計目標

這個專案在「採購流程 + Business Central 整合」這個業務情境下，刻意覆蓋下列技術面向，作為可獨立運行的參考實作：

| 面向 | 此專案的對應實作 |
|------|----------------|
| Dynamics 365 Business Central / NAV 客製 | `extensions/bc-procurement/` 完整 AL Extension（Table、Page、Codeunit、Enum、API Page、Test Codeunit） |
| AL 物件編號規劃 | 全部 Object 落在 50100–50199 Per Tenant Extension 範圍 |
| BC API（OData / Custom API）與外部系統整合 | `apps/api/app/services/business_central_client.py` 同時支援 mock 與 real OAuth 模式 |
| 採購、請購、財務、核准流程 | Draft → Submitted → Approved/Rejected → Synced 完整生命週期，AL 與 FastAPI 雙端對齊 |
| SQL 資料庫、稽核紀錄 | `AuditLog` 表 + 每個狀態變更都寫稽核 |
| 系統文件 | `docs/architecture.md`、`docs/api.md`、`使用方法.md`、`docs/project-guide.md` |
| DevOps | GitHub Actions CI 五個 job + CD 推送至 GHCR + 多階段 Dockerfile + docker-compose |
| 多語系 UI | i18next + zh-TW / en / ja，含 localStorage 偏好持久化 |

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

## 六、Demo 流程（5 分鐘走過一輪）

1. 打開 `http://localhost:5173/`，Dashboard 已有 4 筆 seed data。
2. 點 `➕ New Request`，建立一筆金額 250,000 的請購單。
3. 系統自動標記 **High-Risk**（門檻 100,000，由 `HIGH_RISK_THRESHOLD` 控制）。
4. 進入詳情頁，按 **Submit** → **Approve** → **Sync to Business Central**。
5. 切到 Audit Logs：可看到 4 筆事件（create / submit / approve / sync），同步成功的 BC Document ID 會顯示為 `PO-MOCK-PR…`。
6. 切到 Swagger (`/docs`)，同樣流程在 OpenAPI 介面也能直接驗證。
7. 開 [`extensions/bc-procurement/src/codeunits/ApprovalMgt.al`](extensions/bc-procurement/src/codeunits/ApprovalMgt.al) 對照同樣的狀態機在 AL 端的實作。

---

## 七、CI/CD

### 7.1 CI ([`.github/workflows/ci.yml`](.github/workflows/ci.yml))

每次 push / PR 時跑：

| Job | 內容 |
|-----|------|
| `backend-ci` | ruff lint + pytest（含 coverage） |
| `frontend-ci` | tsc typecheck + ESLint + vite build |
| `docker-build` | Build API + Web 鏡像（不推送） |
| `docs-check` | 確認 README / 使用方法 / docs/* 等必要文件存在 |
| `al-validation` | 驗證 `app.json` schema + AL 檔案語法（advisory；GitHub-hosted runner 無法跑 alc.exe） |

### 7.2 CD ([`.github/workflows/release.yml`](.github/workflows/release.yml))

push 到 `main`、推 `v*.*.*` tag、或手動觸發時跑：

| Job | 內容 |
|-----|------|
| `publish (api)` | Buildx → push `ghcr.io/xu323/business-central-integration-suite/api` |
| `publish (web)` | Buildx → push `ghcr.io/xu323/business-central-integration-suite/web` |
| `summary` | 在 GitHub Actions Summary 列出產生的 image tags |

Tag 規則由 `docker/metadata-action` 自動產生：
- `latest`（main 分支）
- `sha-<7字元>`（每個 commit）
- `1.0.0` / `1.0` / `1`（推 `v1.0.0` tag 時）
- `main` / `pr-<number>`（分支 / PR）

> 第一次 push 後，packages 會在 `https://github.com/xu323?tab=packages` 出現，預設為 **private**。
> 想公開：點該 package → Package settings → Change visibility → Public。

跑釋出版（從 GHCR 拉而不是本地 build）：

```powershell
docker login ghcr.io                 # 私有時需要先登入
docker compose -f docker-compose.ghcr.yml up
```

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
- [`docs/project-guide.md`](docs/project-guide.md) — 專案導覽 + 設計問答

---

## License

MIT — see header in source files. Reference implementation; no production warranty.
