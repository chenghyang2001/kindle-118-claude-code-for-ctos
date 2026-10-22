# 第 2 章演練筆記：代理式轉變

## 做了什麼

1. **建最小付款模組**（TypeScript + Jest，全部用 npm 裝在專案內）
   - `src/lib/errors.ts`：錯誤慣例（AppError 子類別、穩定 `code`、`retryable`、保留 `cause`）
   - `src/payment/processor.ts`：重構前版本，三種付款方式（card / paypal / bank_transfer）擠在一個 `switch`
   - `src/index.ts`：公開 API 入口
   - `tests/payment.test.ts`：16 個測試，只透過公開 API 測
   - 先 commit 一版基準（`7a0f15e`），方便看重構 diff
2. **用書上的提示詞原文跑重構**：開一個無人值守的子 session

   ```bash
   # 先清掉所有 CLAUDE* 環境變數，只讀專案層設定
   for v in $(env | grep -o '^CLAUDE[A-Z_]*'); do unset "$v"; done
   claude -p "<書上提示詞>" --setting-sources project,local --permission-mode acceptEdits \
     --disallowedTools "Bash(git commit*)" "Bash(git push*)" --output-format stream-json --verbose
   ```

   產出：`src/payment/types.ts`、`src/payment/strategies/{card,paypal,bankTransfer,index}.ts`，`processor.ts` 從 109 行縮成 35 行。
3. **寫 [AGENTIC-LOOP.md](AGENTIC-LOOP.md)**：四階段各配一個這次實際發生的 Claude Code 動作
4. **寫 [READINESS.md](READINESS.md)**：8 個虛構 backlog 任務分類（4 Agent 輔助型 / 4 人類主導型）+ 重估時間 + PR 審查調整
5. 專案層權限設定 `.claude/settings.local.json`：允許讀檔、改 `src/`、跑 jest/tsc；禁止改 `tests/`、`src/lib/errors.ts`、`git push`

## 驗證結果

| 項目 | 結果 |
| --- | --- |
| 基準版測試 | 16/16 通過、`tsc --noEmit` 無錯 |
| 子 session 重構 | 22 回合、113 秒、換算 US$0.51（訂閱制，未設 API key）；兩步改、每步都跑測試 |
| 重構後測試（主 session 獨立重跑） | 16/16 通過、`tsc --noEmit` 無錯 |
| 測試檔 / errors.ts / index.ts 是否被改 | `git diff` 確認三者完全沒動 |
| 新舊行為差分（主 session 自己寫的，不採信代理自述） | 378 組輸入 × `processPayment` + `calculateFee` 全部一致，`SUPPORTED_METHODS` 一致 |
| 權限護欄 | 子 session 被擋 3 次：寫 `tests/` 兩次、`git commit` 一次；代理自行改走 `scratch/` 暫存目錄並清掉 |

工具呼叫明細（已去除本機路徑）：[logs/refactor-tool-calls.md](logs/refactor-tool-calls.md)。原始 stream log（`logs/*.jsonl`）含本機路徑，已 gitignore 不入版控。

## 和書上做法的差異

| 書上 | 本練習 | 原因 |
| --- | --- | --- |
| 在既有的真實專案上重構付款模組 | 自建一個 3 種付款方式的最小模組 | 書上沒有範例專案（NotebookLM 查詢確認「無 GitHub 網址」） |
| 互動式 session，人看著代理跑 | `claude -p` 無人值守 + stream log 事後檢視 | 快速演練；也順便示範無人值守時要靠權限設定當護欄 |
| 需要 Anthropic API Key 或帳號 | 用既有訂閱登入，不設 `ANTHROPIC_API_KEY` | 共通限制 |
| 權限／治理可放在全域或託管設定 | 全部寫在專案 `.claude/settings.local.json`，`--setting-sources project,local` 排除全域 hook | 共通限制；也避免全域 Stop hook 讓子 session 自己 commit |
| 檢查表只說「分類 backlog、重估時間、調整 PR 審查」 | 自訂 8 個虛構任務與工時 | 書上沒有具體任務與數字，工時一律標「假設值」 |
| 手續費率、金額上限 | 2.9%+30 分、3.4%、固定 15 元、上限 100 萬 | 書上沒有，程式內註解皆標「假設值」 |

## 過程中踩到的坑

- **TypeScript 7 與 ts-jest 不相容**：`npm install typescript` 預設裝到 7.0.2（原生編譯器版），沒有 ts-jest 需要的 JS API。改釘 `typescript@5`、`jest@29`、`ts-jest@29`、`@types/jest@29`；降版後 node_modules 殘留舊依賴導致 `Cannot find module 'jest-util'`，刪掉 `node_modules` 與 lock 檔重裝才解決。
- **專案設定的 deny 也會擋主 session**：一開始把 `Bash(git commit*)` 寫進 `settings.local.json` 的 deny，結果主 session 自己也不能 commit。改成只在子 session 用 `--disallowedTools` 限制。

## 已知限制（快速模式，未經 QA／審查）

- 付款邏輯是示範用的假實作（卡號結尾 0000 = 拒絕、`@down.example` = 服務中斷），不連任何真實金流
- `tsconfig` 的 `rootDir` 是 `.`，沒設 build 流程，只做型別檢查與測試
- `npm install` 回報有 audit 警告，未處理（開發依賴，示範用途）
