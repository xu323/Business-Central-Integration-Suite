# Phase 1 Audit Report — `apps/web` 前端企業化盤點

> 本報告為 **不修改任何檔案** 的純掃描報告，做為 Phase 2–4 的改造依據。
> 掃描範圍：`apps/web/src/**/*.{ts,tsx,css,json}`，共 **1,524 LOC**。
> 日期：2026-05-10

---

## A. 視覺 demo 訊號清單

### A.1 Emoji 字元（Unicode U+1F300–U+1FAFF, U+2600–U+27BF）

| 檔案 | 行 | 截錄 | 處置 |
|------|----|------|------|
| `src/components/Sidebar.tsx` | 6 | `{ to: "/", labelKey: "nav.dashboard", icon: "📊" }` | → `LayoutDashboard` |
| `src/components/Sidebar.tsx` | 7 | `{ to: "/requests", ..., icon: "🧾" }` | → `FileText` |
| `src/components/Sidebar.tsx` | 8 | `{ to: "/requests/new", ..., icon: "➕" }` | → `FilePlus2` |
| `src/components/Sidebar.tsx` | 9 | `{ to: "/audit", ..., icon: "🔍" }` | → `ScrollText` |
| `src/components/EmptyState.tsx` | 10 | `icon = "📭"` (default param) | → `Inbox` |
| `src/pages/AuditLogPage.tsx` | 40 | `<EmptyState ... icon="📜" />` | → `FileSearch` |
| `src/components/LanguageSwitcher.tsx` | 14–16 | 國旗 emoji `🇹🇼 🇬🇧 🇯🇵`（FLAGS map） | 整個 FLAGS 移除 → 改 `Globe` icon |
| `src/components/LanguageSwitcher.tsx` | 55 | `▾`（下拉箭頭） | → `ChevronDown` |
| `src/components/LanguageSwitcher.tsx` | 79 | `<span ...>✓</span>` | → `Check` |
| `src/i18n/locales/zh-TW.json` | 60 | `"badge": "⚠ 高風險"` | 移除 emoji，改前端 `AlertTriangle` icon |
| `src/i18n/locales/zh-TW.json` | 66, 81 | `"newRequest": "➕ 新增請購單"` | 移除 |
| `src/i18n/locales/zh-TW.json` | 99 | `"cta": "➕ 建立請購單"` | 移除 |
| `src/i18n/locales/zh-TW.json` | 120 | `"addLine": "➕ 新增明細"` | 移除 |
| `src/i18n/locales/zh-TW.json` | 164 | `"submit": "📨 送審"` | 移除 |
| `src/i18n/locales/zh-TW.json` | 165 | `"approve": "✓ 核准"` | 移除 |
| `src/i18n/locales/zh-TW.json` | 166 | `"reject": "✗ 退回"` | 移除 |
| `src/i18n/locales/zh-TW.json` | 167 | `"syncToBC": "🔄 同步至 Business Central"` | 移除 |
| `src/i18n/locales/en.json` | 60, 66, 81, 99, 120, 164–167 | 同上 9 處（英文版） | 同處置 |
| `src/i18n/locales/ja.json` | 60, 66, 81, 99, 120, 164–167 | 同上 9 處（日文版） | 同處置 |

**總計**：emoji / 裝飾字元命中 **35 處**，遍及 8 個來源檔案（含 3 份 locale）。

### A.2 國旗 emoji（重點）

`src/components/LanguageSwitcher.tsx:13–17` 內的 `FLAGS` 物件整段須移除，改為 `Globe` icon + 文字標籤（「繁中 / EN / 日本語」）。

### A.3 寫死的假資料

| 檔案 | 行 | 字串 | 處置 |
|------|----|------|------|
| `src/pages/CreateRequestPage.tsx` | 30 | `requester: "demo.user"` | 來自 `useCurrentUser().name`，readonly |
| `src/pages/CreateRequestPage.tsx` | 31 | `department: "IT"` | 來自 `useCurrentUser().department`，可覆寫 |
| `src/pages/CreateRequestPage.tsx` | 32 | `vendor_no: "V0001"` | 預設空字串 + Vendor Lookup Dialog |
| `src/pages/CreateRequestPage.tsx` | 33 | `vendor_name: "Acme IT Supplies"` | 同上 |
| `src/pages/RequestDetailPage.tsx` | 19 | `useState<string>("manager")`（actor input） | 整個 actor input 移除，改自動帶 `currentUser.id` |
| `src/pages/RequestDetailPage.tsx` | 54 | `actor \|\| "approver"`（fallback） | 移除 fallback |
| `src/pages/RequestDetailPage.tsx` | 57 | `actor \|\| "approver"`（fallback） | 移除 fallback |

**i18n key 名 `approver` / `承認者` 等是業務角色名稱，屬合法業務語彙，保留。**

### A.4 native dialogs（confirm / alert / prompt）

| 檔案 | 行 | 截錄 | 處置 |
|------|----|------|------|
| `src/pages/RequestDetailPage.tsx` | 63 | `if (!confirm(t("detail.deleteConfirm"))) {` | 改 `<AlertDialog>`（Radix），需輸入請購單號才 enable 確認鈕 |

**alert / prompt：0 命中。**

### A.5 console.log

| 檔案 | 行 | 截錄 | 處置 |
|------|----|------|------|
| — | — | — | **0 命中。** |

---

## B. 企業功能缺口清單（按頁面 / 區塊）

### B.1 Sidebar / Topbar — `Layout.tsx / Sidebar.tsx / Topbar.tsx`

| 缺口 | 現況 | Phase 2 處置 |
|------|------|-------------|
| **使用者區塊** | 完全沒有；右上角只有 API health pill + version | Avatar + 姓名 + Email + DropdownMenu（個人設定 / 切換組織 / 偏好設定 / 登出） |
| **通知中心** | 無 | `Bell` icon + unread badge → Popover；無 API 時顯示空狀態 |
| **組織切換器** | 無 | 左上 title 旁顯示 `currentUser.organization.name` + ChevronDown |
| **Command Palette** | 無 | `Cmd/Ctrl+K` → Radix Dialog + cmdk，列頁面 + 動作 |
| **Skip-link / a11y landmark** | 無 `<main>` skip-to-content | A11y baseline |
| **Topbar 元素優先序** | API pill + version 太顯眼 | 縮小，移到 Bell 左側 |

### B.2 DashboardPage

| 缺口 | 現況 | Phase 4 處置 |
|------|------|-------------|
| **Trend / sparkline** | 4 張靜態 stat card | 加 ±% 月對月 + 小型 sparkline (recharts) |
| **時序圖** | 無 | 「近 30 天請購趨勢」雙軸 LineChart（件數 + 金額） |
| **SLA 指標** | 無 | 平均簽核時數、超時件數、瓶頸 approver Top 3 |
| **部門排行** | 無 | 橫向 BarChart top 5 |
| **高風險清單** | 只有計數 | 加 5 筆清單 widget |
| **高風險點擊行為** | `bg-rose-` 計數但不可點 | 點擊跳 list page 加 `?high_risk=true` filter |

### B.3 RequestListPage

| 缺口 | 現況 | Phase 4 處置 |
|------|------|-------------|
| **排序** | 無 | DataTableColumnHeader + sort indicator |
| **分頁** | 全部一次載入 | DataTablePagination |
| **欄位顯示／隱藏** | 8 欄全寫死 | DataTableViewOptions dropdown |
| **欄位凍結** | 無 | sticky-left 第一欄 |
| **密度切換** | 無 | compact 28 / standard 36 / comfortable 44，存 localStorage |
| **Saved views** | 無 | DataTableSavedViews（我的草稿 / 待我簽核 / 本月已同步） |
| **批次操作** | 無 | row select checkbox + DataTableBulkActions |
| **匯出** | 無 | CSV / XLSX (sheetjs) / PDF (jspdf-autotable) |
| **進階篩選** | 只有 status pills + 全文搜尋 | status / date_range / vendor / amount_min/max / dept / high_risk_only / requester |
| **列印** | 無 | window.print() + 專屬 print.css |
| **列名 i18n** | ✅ 已 OK | — |
| **狀態 dot 指示器** | 只有純色 badge | dot + 文字（Fluent semantic） |
| **空狀態** | ✅ 已 OK | 留 |

### B.4 CreateRequestPage

| 缺口 | 現況 | Phase 4 處置 |
|------|------|-------------|
| **表單驗證** | 只有 HTML `required` | react-hook-form + zod schema |
| **千分位 / 貨幣 prefix** | `toLocaleString()` 純顯示 | react-number-format（input 即時格式化） |
| **Vendor lookup** | 純文字輸入 | VendorLookupDialog（搜尋 / 分頁 / 選取，前端 mock 12 筆台日企業樣本） |
| **Item lookup** | 純文字輸入 | ItemLookupDialog 同上 |
| **UoM / Currency / Department combobox** | 純 input | Radix Popover + cmdk |
| **附件上傳** | 無 | AttachmentDropzone（前端 stub，附 `// TODO: backend endpoint` 註解） |
| **內部 / 對外備註** | 只有 description | 雙 textarea |
| **自動儲存草稿** | 無 | 30 秒 debounce → `createRequest(draft=true)`，右上「已自動儲存 14:32」 |
| **提交按鈕分流** | 只有「Save as Draft」 | 兩顆：「儲存為草稿」+「送出簽核」 |
| **Required date 驗證** | 無 | zod refine `>= today` |
| **金額 ≥ 0** | `min={0}` | zod number().positive() |
| **Currency 為 input** | 無 dropdown | Combobox |
| **欄位寬度跟著螢幕跑** | 寫死 `w-24/20/32` | 改 fr 或 grid-cols |

### B.5 RequestDetailPage

| 缺口 | 現況 | Phase 4 處置 |
|------|------|-------------|
| **手填 actor** | input + state | 移除，自動帶 `currentUser.id` |
| **角色檢查** | 無 | `roles ⊉ {Approver}` 時 approve/reject disable + tooltip「需要 Approver 角色」 |
| **ApprovalTimeline** | 只有純表格 audit logs | 直立時間軸：時間點 + actor avatar + 動作 icon + 狀態變化 + 註解 |
| **列印 / 匯出 PDF** | 無 | `jspdf` 標準採購單格式 PDF |
| **複製為新單** | 無 | 帶資料跳 CreateRequest |
| **轉寄** | 無 | Dialog 選 approver |
| **Delete confirm** | native `confirm()` | AlertDialog + 輸入單號才 enable |
| **Workflow Actions 排版** | 直列 6 顆按鈕 | Fluent CommandBar 風格 |
| **Audit 區塊** | 內嵌 plain table | DataTable + 日期區間 + actor 過濾 |
| **Field 區塊密度** | 12 個欄位散開 | 分組 collapsible（General / Vendor / Approval / Sync） |

### B.6 AuditLogPage

| 缺口 | 現況 | Phase 4 處置 |
|------|------|-------------|
| **日期區間** | 只能 limit | DateRangePicker |
| **actor 過濾** | API 支援，UI 沒接 | actor combobox |
| **action 過濾** | API 支援，UI 沒接 | action multi-select |
| **匯出** | 無 | CSV / XLSX |
| **payload diff 展開** | target_id 截 8 字、payload 不顯示 | row expansion + before/after diff |
| **target_id 複製** | 截斷顯示 | 完整 mono + hover 複製按鈕 |

### B.7 全域

| 缺口 | 現況 | Phase 處置 |
|------|------|-----------|
| **Toast 系統** | 無，錯誤用 inline rose card | sonner，main.tsx 加 `<Toaster />` + `notify.ts` helper |
| **Skeleton loading** | 一律 `<Spinner />` 整頁閃白 | DashboardSkeleton / TableSkeleton / DetailSkeleton |
| **Modal 系統** | 無 | Radix Dialog + AlertDialog |
| **ErrorBoundary** | 無 | App 最外層包，含 ticket id (nanoid) + 複製錯誤 + 回首頁 + 重新載入 |
| **Breadcrumb** | 無 | 全域元件（首頁 / 請購單 / {number}） |
| **Keyboard shortcut helper** | 無 | `?` 鍵彈出快捷鍵清單 |
| **最近瀏覽 / 我的最愛** | 無 | side panel + localStorage |
| **千分位 / 多幣別 formatCurrency** | 已支援 locale，但無負值 / 零值處理 | 統一 helper |
| **日期 i18n locale 對齊** | ✅ 已用 Intl.DateTimeFormat 切 zh-TW / en-US / ja-JP | 留 |
| **API 401/403 處理** | 純 throw | 全域攔截 → toast + 引導 sign-in |

---

## C. 設計語言偏差清單（vs Microsoft Fluent 2 / D365 BC）

### C.1 色票

| 規範 | 目前 | Fluent 2 / D365 BC | 差距 |
|------|------|-------------------|------|
| 主色 (brand 500) | `#3b65ff` 偏紫藍 | `#0078D4` (Microsoft Blue) | **嚴重偏離**，整套 brand-* 需重設 |
| 主色 (brand 600 hover) | `#2c4fe6` | `#106EBE` | 重設 |
| 主色 (brand 700 active) | `#1f3bbf` | `#005A9E` | 重設 |
| 中性灰 | Tailwind 預設 `slate-*` | Fluent neutral 10/20/30/40/60/90/130/160/190 | **未對齊**，需新增 neutral palette |
| Success | `bg-emerald-100/600` (emerald) | `#107C10` (Fluent green) + bg `#DFF6DD` | 偏綠，要改 |
| Warning | 沒定義（用 amber） | `#797673` + bg `#FFF4CE` | 加 |
| Danger | `bg-rose-*` | `#A4262C` + bg `#FDE7E9` | 偏 rose，要改 |
| Info | 用 brand-100 | `#0078D4` + bg `#DEECF9` | 加 |

### C.2 字體

| 規範 | 目前 | Fluent 2 | 差距 |
|------|------|----------|------|
| Sans 主體 | Inter, ui-sans-serif, Segoe UI, Microsoft JhengHei | **Segoe UI Variable Display, Segoe UI Variable, Segoe UI**, Microsoft JhengHei UI, Yu Gothic UI | 沒用 Segoe UI Variable，需引入 web font |
| Mono | 沒定義 | Cascadia Code, Cascadia Mono, Consolas | 加 |
| Body 字級 | text-sm 為主 | Fluent body 14px / 14sp 一致 | 大致 OK |

### C.3 圓角

| 元件 | 目前 | Fluent 2 | 差距 |
|------|------|----------|------|
| Card | `rounded-xl`（12px） | 4px | 改 `rounded`（4px） |
| Button | `rounded-lg`（8px） | 4px | 改 |
| Input | `rounded-lg`（8px） | 4px | 改 |
| Badge | `rounded-full` | 2px / 4px（pill 限狀態用） | dot + 4px corner |

### C.4 陰影

| 元件 | 目前 | Fluent 2 (depth) | 差距 |
|------|------|----------------|------|
| Card | `0 1px 2px / 0 1px 3px` 偏輕 | `0 1.6px 3.6px / 0 0.3px 0.9px` (depth 4) | 改 |
| Dropdown / Popover | 用 `shadow-card` | `0 6.4px 14.4px / 0 1.2px 3.6px` (depth 16, flyout) | 加 `shadow-flyout` |
| Modal | 沒定義 | depth 64 | Phase 3 補 |

### C.5 密度

| 規範 | 目前 | Fluent / BC | 差距 |
|------|------|------------|------|
| Card padding | `p-5`（20px） | 16px | 改 `p-4` |
| Table row 高 | 預設（`py-3` ≈ 44px） | 32px compact / 36 standard / 44 comfortable | 加 density toggle，預設 standard |
| Sidebar item | `py-2`（≈ 36px） | 32px | 改 |

### C.6 焦點態（focus）

| 目前 | Fluent 2 | 差距 |
|------|----------|------|
| `focus:ring-2 focus:ring-brand-500 focus:border-transparent` | **Fluent stealth focus**: 2px outline brand-500 + 2px white offset | 需重寫 utility |

### C.7 按鈕系統

| 種類 | 目前 | Fluent 2 對應 | 差距 |
|------|------|--------------|------|
| Primary | `btn-primary` | Primary | hover/active 顏色不對 |
| Outline | `btn-outline` | Secondary (default) | OK 改顏色即可 |
| Subtle (transparent hover) | 無 | Subtle | 新增 `.btn-subtle` |
| Success | 有 | 有 | 改色 |
| Danger | 有 | 有 | 改色 |
| Disabled state | `opacity-50` | `bg-neutral-30 text-neutral-90` | 改 |
| Loading | 顯示 `…` 字 | `Loader2` 旋轉 icon | 改 |

### C.8 Icon

| 規範 | 目前 | Phase 2/3 處置 |
|------|------|-------------|
| Icon 套件 | 完全沒有，全用 emoji | **lucide-react**（單一來源） |
| Icon 規格 | n/a | inline 16 / nav-button 18 / header 20，stroke-width 1.75 |

### C.9 Label / 表單

| 目前 | Fluent 2 | 差距 |
|------|----------|------|
| `.label` 用 `uppercase tracking-wide` | sentence-case，無 tracking | 移除 uppercase + tracking |
| 必填欄位無視覺標示 | 紅色 `*` | 加 |
| 錯誤訊息位置 | inline rose card | 欄位下方紅字 + `AlertCircle` icon |

### C.10 狀態 badge

| 狀態 | 目前 | Fluent semantic | 處置 |
|------|------|----------------|------|
| Draft | slate（neutral） | Neutral | 留 |
| Submitted | amber | Severe → Warning | 改 |
| Approved | emerald | Success | 改色為 Fluent `#107C10` |
| Rejected | rose | Danger | 改色為 Fluent `#A4262C` |
| Synced | brand-100 | Brand | 改色為 Fluent `#0078D4` |
| **Dot 指示器** | 沒有 | Fluent 慣例：左小圓點 + 文字 | 新增 |

---

## D. 其他發現（不在原任務清單，但建議列入）

| 項目 | 風險 | 建議 |
|------|------|------|
| **CSS reset / antialiasing** | 已有 `-webkit-font-smoothing` | 補 `text-rendering: optimizeLegibility` 在 Phase 3 |
| **API 401 沒處理** | 用真實 BC 後 token 失效會直接跳一段紅字 | Phase 4 加 axios/fetch 攔截器 → toast + 重新 sign-in |
| **HTML lang attribute** | i18n 已 sync 到 `<html lang>` ✅ | 留 |
| **無 `prefers-reduced-motion` 支援** | a11y | Phase 3 在 Tailwind 加 `motion-reduce:` 變體於 Loader2 |
| **i18n key 中有 emoji** | Phase 2 會清掉，但日後新增需有規範 | 在 `.claude/skills/frontend-dashboard/SKILL.md` 加「i18n 字串禁止 emoji」規則 |
| **sidebar 不能 collapse** | 中型/小型螢幕可用度差 | Phase 4 加 collapsible（圖示模式） |
| **無 404 頁** | 目前用 `<Navigate to="/" replace />` 全部丟回首頁 | Phase 4 補 NotFoundPage |

---

## E. 統計總覽

| 類別 | 命中數 |
|------|------|
| Emoji / 國旗 / 裝飾字元 | **35 處 / 8 檔** |
| 寫死假資料（demo.user/Acme/V0001/manager/approver） | **7 處 / 2 檔** |
| native confirm/alert/prompt | **1 處 / 1 檔** |
| console.* | **0** |
| 設計語言偏差項目 | **40+** |
| 企業功能缺口 | **約 70 項**（含全域 + 6 個畫面） |

---

## F. Phase 2 起手規劃（預告）

按任務指示，Phase 2 將執行（不在 Phase 1 範圍內，僅作預告）：

1. `npm i lucide-react @radix-ui/react-{alert-dialog,dropdown-menu,popover,dialog,tooltip} sonner clsx`（**clsx 已在，會 dedupe**）
2. 替換 emoji 為 lucide-react icon（35 處）
3. 移除 `LanguageSwitcher` FLAGS、改 `Globe`
4. 新增 `src/auth/useCurrentUser.ts` + mock 使用者（無寫死 demo.user / Acme）
5. `RequestDetailPage` 移除 actor input + 加角色檢查
6. Topbar 升級：avatar + 通知 + 組織切換 + Cmd+K
7. AlertDialog 替換 native confirm + 輸入單號 destructive flow
8. sonner Toast 系統 + `notify.ts`
9. Skeleton 系統 + ErrorBoundary
10. 跑 `npm run build / lint`，產 5 張 Playwright 截圖到 `outputs/screenshots/phase2/`
11. **停下並請使用者確認** 才進 Phase 3

**Phase 2 執行前等候確認 → 接著進 Phase 3 / 4 / 5。**

— *End of Phase 1 audit.*
