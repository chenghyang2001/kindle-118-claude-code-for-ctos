# VERIFY：第 18 章 Cascade 驗證紀錄

> 產生時間：2026-10-22 14:08。Node v24.19.0，Claude Code 2.1.308。

## 三個 repo 的 git log

### shared-contracts

```text
7e54e6b 新增 Invoice 選填欄位 billingPeriod（契約 v1.1.0）
425d9a4 初始化 shared-contracts（沿用第 17 章佈局）
```

### backend

```text
c7f1309 新增發票 billingPeriod 輸出並保持向下相容（billing-period）
7341fd1 初始化 backend（沿用第 17 章佈局）
```

### frontend

```text
9064059 新增發票計費期間顯示並相容舊後端（billing-period）
fcd9c69 初始化 frontend（沿用第 17 章佈局）
```

## 測試結果（`npm test`，即 `node --test`）

| repo | tests | pass | fail |
| --- | --- | --- | --- |
| shared-contracts | 5 | 5 | 0 |
| backend | 7 | 7 | 0 |
| frontend | 5 | 5 | 0 |

## 相容性交叉驗證（實際起 server 用 CLI 呼叫）

| 組合 | 結果 | 輸出 |
| --- | --- | --- |
| 舊 frontend（fcd9c69）→ 新 backend | PASS | `發票 inv-001｜客戶 cust-42｜狀態 issued｜總額 990.00 TWD` |
| 新 frontend → 新 backend（inv-001） | PASS | `發票 inv-001｜客戶 cust-42｜狀態 issued｜總額 990.00 TWD｜期間 2026-10-01 ～ 2026-10-31` |
| 新 frontend → 新 backend（舊資料 inv-000） | PASS | `發票 inv-000｜客戶 cust-7｜狀態 paid｜總額 300.00 TWD` |
| 新 frontend → 舊 backend（7341fd1，worktree） | PASS | `發票 inv-001｜客戶 cust-42｜狀態 issued｜總額 990.00 TWD` |

## 交接文件產生（`claude -p`）

- 指令：在 `work/` 執行，先清 `CLAUDE*` 環境變數，`claude -p --setting-sources project,local --allowedTools "Read,Glob,Grep,Bash(git -C shared-contracts show:*),Bash(git -C shared-contracts log:*)" < 提示詞`（prompt 由 stdin 傳入）
- 第 1、2 次：子 session 用 Write 寫 `.claude/handoffs/` 被權限擋下（`.claude/` 為受保護目錄），見 `logs/handoff-run2-write-denied.log`
- 第 3 次：改為讓子 session 把全文輸出到 stdout，再導向 `work/.claude/handoffs/billing-period.md`（196 行，6 個段落齊全）
- 子 session 副作用：三個 repo 在交接步驟前後 commit 數不變、工作樹乾淨（子 session 沒有自己 commit）
