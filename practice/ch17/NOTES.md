# NOTES：K118 第 17 章「多儲存庫設定」快速演練

> 快速 demo 模式：沒有跑 QA／code review，只做冒煙測試。

## 做了什麼

1. **平坦同級佈局** `work/`（父目錄本身不是 repo）
   - `work/shared-contracts`：`openapi/billing.yaml` + `types/billing/invoice.js`（JSDoc 型別＋`validateInvoice`）
   - `work/backend`：零依賴 Node API，`GET /invoices/:id`
   - `work/frontend`：零依賴 Node CLI 用戶端，呼叫 backend 後用共用契約驗證回應
   - 三個 repo 各自 `git init -b main` 並 commit 一次
2. **控制區** `work/.claude/`
   - `CLAUDE.md`：生態系簡報（各 repo 角色、依賴方向、部署順序 shared-contracts → backend → frontend）
   - `modules/billing.md`：billing 模組在三個 repo 的檔案位置
   - `settings.local.json`：專案層權限（允許讀檔與跑測試、禁止 `git push`、禁讀 `.env`）
   - `ONBOARDING.md`：新人 clone 三個 repo＋啟動 spanning session（從 `work/` 開，或 `--add-dir`）
3. **練習 repo 根目錄**
   - `.gitignore` 加 `work/`（內層 repo 不進外層版控）
   - `control-snapshot/`：控制區的副本，方便 commit
   - `VERIFY.md`：`claude -p` 驗證紀錄
4. **驗證**：`claude -p --setting-sources project,local` 在 `work/` 執行，答對「`shared-contracts/types/billing/invoice.js`，部署順序 shared-contracts → backend → frontend」，並指出資訊來自控制區。詳見 `VERIFY.md`。

## 驗證結果

| 項目 | 結果 |
| --- | --- |
| 三個 repo 單元測試 | 各 2 pass / 0 fail |
| frontend → backend 端到端 | 200 正常顯示、404 正確報錯 |
| spanning session 讀控制區 | PASS |
| 子 session 副作用 | 無（repo 沒有多出 commit） |

## 和書上做法的差異

| 書上 | 本演練 | 原因 |
| --- | --- | --- |
| 共用型別多半是 TypeScript 套件 | 用 JSDoc `@typedef` + 純 JS，未裝 TypeScript | 快速模式，零依賴；免除 TS 版本相容問題 |
| repo 間透過套件發佈或 workspace 連結 | 用相對路徑 `require("../../../shared-contracts/...")` | 沒有 registry；只在平坦同級佈局下成立 |
| clone 遠端 repo | 本機 `git init`，ONBOARDING 的 clone 網址只是範本 | 限制：不建遠端 repo、不 push |
| 控制區可能放全域或託管設定 | 只用 `work/.claude/settings.local.json`（專案層） | 限制：不改全域 `~/.claude/` |
| 控制區本身可能是一個 repo | `work/` 不是 repo；控制區另外複製到 `control-snapshot/` 版控 | 依題目要求 |
| frontend 通常是網頁 | Node CLI 用戶端 | 題目允許；比較好在終端機驗證 |

## 已知限制

- `control-snapshot/` 是手動複製，與 `work/.claude/` 可能不同步；改了控制區要記得再複製一次。
- 示範發票資料（`inv-001`、金額 99000 分）是**假設值**，書上沒有。
- `--add-dir` 方式的工作目錄是單一 repo，讀不到 `work/.claude/`（ONBOARDING 有註明），這次只驗證了「從 `work/` 開 session」的方式。
- 父目錄 `k118-ch17-practice/CLAUDE.md` 也會被 `work/` 底下的 session 載入（Claude Code 會往上讀祖先目錄的 CLAUDE.md），這次不影響答案。
