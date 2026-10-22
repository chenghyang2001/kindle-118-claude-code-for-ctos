# 代理式作業迴圈：Observe → Plan → Act → Verify

K118《Claude Code for CTOs》第 2 章「代理式轉變」的核心：代理不是「補完一行程式」，而是自己跑一個循環——先看懂程式碼庫、規劃改法、跨檔案動手、再用測試驗證並自我修正，直到完成。

下面四個實例都來自本練習**真的跑過的一次** `claude -p` 重構（書上的提示詞原文，見下方），編號對應 [`logs/refactor-tool-calls.md`](logs/refactor-tool-calls.md) 的工具呼叫序號。

```text
Refactor the payment processing module to use the strategy pattern. Keep the existing public API unchanged.
Follow the error handling conventions in src/lib/errors.ts . Run the test suite after each major change
and fix any failures before moving on.
```

```text
   ┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
   │ Observe  │ ──▶ │   Plan   │ ──▶ │   Act    │ ──▶ │  Verify  │
   │ 讀檔/跑測 │     │ 拆兩步改  │     │ 跨檔寫入  │     │ 測試+差分 │
   └──────────┘     └──────────┘     └──────────┘     └────┬─────┘
        ▲                                                   │ 失敗就回頭修
        └───────────────────────────────────────────────────┘
```

## 1. Observe（觀察）

**目的**：在動手前建立對程式碼庫的正確認識，而不是憑提示詞猜。

**Claude Code 實例**（#1～#6）：

| # | 動作 | 看到什麼 |
| --- | --- | --- |
| 1 | `git ls-files && cat package.json` | 專案結構、測試指令是 `jest` |
| 2 | Read `src/payment/processor.ts` | 一個大 `switch` 包三種付款方式 |
| 3 | Read `src/lib/errors.ts` | 錯誤慣例：AppError 子類別 + 穩定 `code` + `retryable` |
| 4 | Read `tests/payment.test.ts` | 公開 API 的實際契約（含錯誤欄位 `field`） |
| 5 | Read `src/index.ts` | 對外匯出哪些名稱——「API 不變」的邊界 |
| 6 | `npx jest && npx tsc --noEmit` | 先取得基準線：16/16 通過、型別無誤 |

**CTO 觀點**：#6 很關鍵——代理先確認「改之前是綠的」，之後的紅燈才有意義。

## 2. Plan（計畫）

**目的**：把大改動拆成可驗證的小步，每步之後都能跑測試。

**Claude Code 實例**：子 session 的最終回報寫明它的計畫是「**分兩步改**：先新增策略層、不動舊程式；再把 `processor.ts` 改成交給策略處理」。並刻意保留一個行為細節：「先驗金額和幣別，再查付款方式」的順序不變（否則「金額錯 + 方式不支援」時丟的錯誤種類會改變）。

在互動模式下，這一步可以用 Plan Mode（Shift+Tab 切換，或書第 5 章的 `/plan`）讓代理先交出計畫、人類批准後才寫檔。本練習用 `-p` 無人值守，所以計畫只出現在回報裡。

## 3. Act（執行）

**目的**：跨多個檔案自主動手，不需要人一個個指定。

**Claude Code 實例**（#7～#13）：

| 步驟 | 動作 |
| --- | --- |
| 第一步（#7～#11） | 新建 `types.ts`（`PaymentStrategy` 介面）、`strategies/card.ts`、`paypal.ts`、`bankTransfer.ts`、`strategies/index.ts`（註冊表） |
| 第二步（#13） | 把 `processor.ts` 從 109 行的 switch 縮成 35 行，只做共用驗證 + `getStrategy(method).process(req)` |

順帶一個代理自己發現的細節：註冊表用 `Map` 而不是一般物件，避免 `"constructor"`、`"__proto__"` 這類原型鏈鍵被誤判成支援的付款方式。

## 4. Verify（驗證）

**目的**：用客觀訊號（測試、型別檢查）證明改對了，失敗就回到前面修。

**Claude Code 實例**：

| # | 驗證 | 結果 |
| --- | --- | --- |
| 12 | 第一步之後 `tsc` + `jest` | 16/16 通過 |
| 14 | 第二步之後 `tsc` + `jest` | 16/16 通過 |
| 15～19 | 自己寫暫存「差分測試」：用 405 組輸入比對新舊版本的回傳值與錯誤 | 全部一致，跑完刪掉暫存檔 |
| 21 | 最終再跑一次 | 16/16 通過 |

迴圈裡的「自我修復」這次沒用上（每步都一次就綠），但**權限護欄**被觸發了三次：代理想把暫存測試寫進 `tests/`（被 `deny` 擋下）→ 它自己改放到 `scratch/` 再刪除；想 `git commit`（被擋）→ 改成在回報裡請人類提交。這正是第 2 章說的「治理 Harness」：讓代理自主，但邊界由人設定。

主 session（人類這一側）另外做了獨立驗證，不只相信代理的自述——見 [NOTES.md](NOTES.md)。
