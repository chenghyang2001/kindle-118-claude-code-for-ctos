# NOTES：K118 第 18 章「多儲存庫開發」快速演練

> 快速 demo 模式：沒有跑 QA／code review，只跑單元測試與實際串接的冒煙測試。

## 做了什麼

0. **重建第 17 章佈局**：把第 17 章 `work/` 的檔案（不含 `.git`）複製過來，`shared-contracts`、`backend`、`frontend` 各自 `git init -b main` 並做初始 commit。根目錄 `.gitignore` 加 `work/`。
1. **契約層（shared-contracts）**：`Invoice` 加選填 `billingPeriod: { start, end }`（ISO `YYYY-MM-DD`，兩端皆含）。
   - `types/billing/invoice.js`：JSDoc `BillingPeriod` 型別、`isIsoDate()`（擋 `2026-02-30`）、`validateBillingPeriod()`（start ≤ end、`null` 不合法）
   - `openapi/billing.yaml`：新增 `BillingPeriod` schema（`format: date`），`Invoice` 引用但不列入 `required`
   - 版本 1.0.0 → 1.1.0，新增 `CHANGELOG.md`，3 個新測試
2. **跨 repo 交接**：寫提示詞 `work/.claude/prompts/cross-repo-handoff.md`，在 `work/` 用 `claude -p --setting-sources project,local` 產生 `work/.claude/handoffs/billing-period.md`（變更摘要、前後 JSON、型別、各消費端檔案表、相容性矩陣、部署順序與驗收清單）。
3. **後端（向下相容）**：`inv-001` 帶期間；新增沒有期間的舊資料 `inv-000`，回應「省略欄位」而不是 `null`。舊用戶端不需帶任何新參數。新增 2 個 service 測試與 `server.test.js`（3 個真實 HTTP 測試）。
4. **前端**：`formatInvoice()` 有期間時加「｜期間 start ～ end」，沒有時照舊（不會出現 `undefined`）。新增 3 個測試。
5. **控制區**：`modules/billing.md` 加變更紀錄；整個 `work/.claude/` 複製到 `control-snapshot/`。

三個 repo 的 commit 訊息都引用變更代號 `billing-period`，順序照部署規則 shared-contracts → backend → frontend。

## 驗證結果（詳見 VERIFY.md）

| 項目 | 結果 |
| --- | --- |
| 測試 | shared-contracts 5/5、backend 7/7、frontend 5/5 |
| 舊 frontend → 新 backend | PASS（新欄位被忽略） |
| 新 frontend → 新 backend | PASS（顯示期間；舊資料不顯示） |
| 新 frontend → 舊 backend | PASS（用 git worktree 檢出舊 backend） |
| 交接文件 | 196 行，書上要求的內容都有 |
| `claude -p` 子 session 副作用 | 無（沒有自行 commit 或改檔） |

## 和書上做法的差異

| 書上 | 本演練 | 原因 |
| --- | --- | --- |
| 交接提示詞照書上原文 | 書的原文不在本機，提示詞依書上 Cascade 的要求（前後 JSON、型別、各消費端檔案、相容性）自行重建 | 找不到原文；結構照書，文字是自己寫的 |
| 子 session 直接把交接文件寫進 `.claude/handoffs/` | 子 session 輸出到 stdout，再由外層導向檔案 | headless 模式寫 `.claude/` 會被擋（受保護目錄），`--permission-mode acceptEdits` 加專案層 `Edit(./.claude/handoffs/**)` 也沒用；不想用 bypassPermissions |
| 共用型別多半是 TypeScript 套件 | 沿用第 17 章的 JSDoc + 純 JS，未裝 TypeScript | 快速模式、零依賴 |
| 契約透過套件版本發佈，消費端升版 | 相對路徑 `require` 同級 repo，版本號只在 package.json／OpenAPI／CHANGELOG 標示 | 沒有 registry；也因此「改契約當下兩個消費端的驗證規則就同時變新」，交接文件有提醒 |
| 各環境依序部署 | 只在本機用測試與 worktree 模擬「新舊版本互打」 | 沒有部署環境 |
| 控制區設定 | 只改 `work/.claude/settings.local.json`（專案層） | 限制：不改全域 `~/.claude/` |

## 過程中踩到的坑

- 專案層權限寫 `Write(path)` 無效，Claude Code 回報「只有 `Edit(path)` 規則會套用到檔案寫入」。已改成 `Edit(./.claude/handoffs/**)`。
- 第一次用 worktree 檢出舊 backend 時放在 `work/` 外面，結果相對路徑 `../../../shared-contracts` 找不到模組。平坦同級佈局下 worktree 也要放在 `work/` 底下。

## 假設值

- 計費期間 `2026-10-01`～`2026-10-31`、舊發票 `inv-000`（客戶 `cust-7`、金額 30000 分）都是**假設值**，書上沒有。
- 沿用第 17 章的 `inv-001`（99000 分）也是假設值。

## 檔案位置

- `work/`（不進外層版控）：三個 repo＋控制區
- `control-snapshot/`：控制區副本（含 `handoffs/billing-period.md`、`prompts/cross-repo-handoff.md`）
- `logs/`：`claude -p` 與相容性測試的輸出
