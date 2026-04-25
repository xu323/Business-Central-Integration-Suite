# 安全 / 上線檢查清單

> 由 **Security / Architecture Review Agent** 維護。任何 PR 都應該過一次這份清單。

## 1. 機敏資料

| 項目 | 現況 | 上線前需做 |
|------|------|-----------|
| BC Client Secret / Tenant Id | 透過 `.env` 注入；`.env` 已在 `.gitignore` 內 | 改用 Azure Key Vault / GitHub Actions secrets，不要進 `.env` 檔。 |
| `SECRET_KEY` | 預設 `change-me`，產生於 `.env.example` 提示 | 部署前必須換成 `python -c "import secrets; print(secrets.token_hex(32))"` 產生。 |
| Audit log payload | 會把 `request_payload` / `response_payload` 序列化進 DB | 上線前確認沒有寫入 raw token；目前 [`business_central_client.py`](../apps/api/app/services/business_central_client.py) 不會把 token 放進 payload。 |
| Logger | `logger.error` 只記錄 status code 與前 500 字 body | 確保上線時 log 等級為 INFO 而非 DEBUG。 |

## 2. 認證 / 授權

| 項目 | 現況 | 建議 |
|------|------|------|
| API endpoint 認證 | 目前 demo 開放 | 上線前掛 OAuth2 Bearer middleware（推薦 [`fastapi-azure-auth`](https://intility.github.io/fastapi-azure-auth/)），驗證 Entra ID JWT。 |
| BC 端認證 | OAuth2 Client Credentials（S2S） | 已在 `BusinessCentralClient._get_token()` 實作；token 有 60 秒 buffer。 |
| BC PermissionSet | AL Extension 沒寫 `permissionset` | 上 production 前應建立 `permissionset 50100 "PR Approval"`，含相關 table data 權限。 |

## 3. 輸入驗證

- 所有請求都通過 Pydantic v2，含 `max_length` / `ge` / `le` / `MinValue`。
- SQLAlchemy ORM 全程使用 parameterized query，**沒有字串拼接 SQL**。`Grep` 搜尋 `"SELECT" + str()`、`f"select` 結果為 0 命中。
- AL Table 欄位設 `MaxStrLen` 限制；`Approver` 用 `CopyStr(UserId(),...)` 截斷，避免 buffer overflow。

## 4. CORS / Cookies

- `cors_allow_origins` 預設只允許 `http://localhost:5173,http://localhost:3000`；不是 `*`。
- 沒有使用 cookie auth；改用 token 模式（不需要 CSRF）。

## 5. 錯誤訊息

- HTTP 4xx 訊息只包含「狀態違規 / 找不到」這類業務錯誤；不會吐出 stack trace。
- 502 BC 同步失敗會把 `error.message` 回給前端，但**不會**回 BC 完整 response body（避免 token 殘留）。

## 6. 依賴

- 所有 Python / npm 套件皆從官方 registry，並在 `requirements.txt` / `package.json` 內 pin 版本。
- 沒有任何來源不明的 git submodule 或 fork。

## 7. CI / Deployment

- GitHub Actions 沒有 `--no-verify`、`--no-gpg-sign` 等危險旗標。
- Docker 鏡像為 multi-stage、slim。
- 沒有自架 runner，避免 supply chain 攻擊面。

## 8. 上線前最終 checklist

- [ ] `.env` / Key Vault：所有 BC_ 相關欄位填好真實值，且 `BC_MODE=real`
- [ ] `SECRET_KEY` 已替換為 64 字元亂數
- [ ] FastAPI 加上 Entra ID JWT 驗證 middleware
- [ ] BC Extension 上掛 `permissionset` 並指派
- [ ] DB 改用 Managed PostgreSQL（含備份 + TLS）
- [ ] 對外 endpoint 透過 Azure API Management，加上 rate limiting + WAF
- [ ] 記得把 docker-compose 中的明文密碼改成 `secrets:`
- [ ] 接 Azure Application Insights 監控錯誤與 sync failure ratio
