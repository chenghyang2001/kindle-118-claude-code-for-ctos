# PRE-REVIEW：PR 代理預審結果

> 依書上「PR 代理預審」流程：合併前先讓代理以唯讀方式，從**正確性、資安、規範、測試缺口**四個面向審查，
> 每個問題標嚴重度，**high 以上必修**後才算可合併。

## 使用的提示詞

以 headless 模式執行（先清掉 `CLAUDE*` 環境變數，並加 `--setting-sources project,local` 排除全域 hook；只給 Read／Grep／Glob 唯讀工具）：

```bash
claude -p --setting-sources project,local --allowedTools "Read,Grep,Glob" \
  "你是 PR 預審代理。請審查這個 Express+TypeScript RBAC 專案（src/ 與 tests/，需求見 PRD.md、
   方案見 PLAN.md）尚未合併的變更，從四個面向檢查：1) 正確性（邏輯錯誤、與 PRD 驗收條件不符）
   2) 資安（越權、資訊洩漏、注入、認證弱點）3) 規範（命名、型別、錯誤處理一致性）
   4) 測試缺口（缺少的案例）。每個問題標嚴重度 critical/high/medium/low，附檔案:行號、
   說明與建議修法。只讀不改檔。用繁體中文、Markdown 輸出，最後給一個總結表。"
```

## 第一輪（實作完成、37 個測試全過時）

| 嚴重度 | 數量 |
| --- | --- |
| critical | 0 |
| **high** | **2** |
| medium | 5 |
| low | 12 |

### high 問題與處理

| # | 問題 | 處理 |
| --- | --- | --- |
| H-1 | admin 可以 `PATCH` 把自己（或最後一位 admin）降級，效果等同 AC11 想防的「系統沒有管理員」 | ✅ 已修：`UserService` 新增 `assertNotLastAdmin()`，`update()` 把 admin 降級、`remove()` 刪除 admin 前都會檢查，至少要留一位 admin，否則 400（`src/services/user.ts`） |
| H-2 | H-1 沒有測試涵蓋 | ✅ 已補：`tests/users.api.test.ts` 加「唯一 admin 不能自我降級」「兩位 admin 可降一位、不能降最後一位」兩個測試 |

### 順手修的 medium（改動小、用戶端可直接觸發）

| # | 問題 | 處理 |
| --- | --- | --- |
| M-a | body 超過 10kb 回 500 而不是 413 | ✅ 錯誤中介層改用 body-parser 的 `err.type` 精確判斷：`entity.parse.failed`→400、`entity.too.large`→413 |
| M-b | `express.json()` 在認證前，未登入者送壞 JSON 拿到 400 而非 401 | ✅ 調換順序，先 `authenticate` 再解析 body |
| M-c | 回應帶 `X-Powered-By: Express` | ✅ `app.disable("x-powered-by")` |
| M-d | 錯誤分類靠 `status === 400` 鴨子型別 | ✅ 隨 M-a 一併修正 |
| M-e | 缺「刪除後舊 token 失效」API 層測試等 | ✅ 補 413、未登入壞 JSON→401、舊 token→401、無 X-Powered-By 三個測試 |

修完後：42 個測試全過、`tsc --noEmit` 無錯。

> 修正過程中有一個測試失敗：413 測試預期 413 但拿到 500。查證後是**實作的問題**——錯誤中介層的修改因格式化工具改了排版而沒套上，程式仍走舊的 500 分支；測試本身正確。補上修改後轉綠。

## 第二輪（修正後重審）

| 嚴重度 | 數量 |
| --- | --- |
| critical | 0 |
| high | **0** ✅ |
| medium | 4 |
| low | 11 |

結論：**達到「high 以上為 0」的合併門檻**。以下列為後續待辦，本次不修（快速 demo 模式，只修 high 以上）：

| ID | 嚴重度 | 摘要 |
| --- | --- | --- |
| M-1 | medium | body-parser 其他用戶端錯誤（415 charset／encoding、request.aborted）仍會被當 500；建議改用 `err.expose && status < 500` 通用判斷 |
| M-2 | medium | email 正規式有多項式回溯風險、無長度上限（建議 ≤ 254） |
| M-3 | medium | name 無長度與控制字元限制（建議 ≤ 100） |
| M-4 | medium | 「未知錯誤 → 500 且固定訊息」沒有測試 |
| L-1 | low | 未知路由回 HTML 404，與 JSON 錯誤格式不一致 |
| L-2 | low | `parseId` 接受 `0x2`、`1e0` |
| L-3 | low | editor 送與原值相同的 role 也 403（需 PRD 寫明） |
| L-4 | low | editor 可改 admin 的 name／email（需 PM 確認） |
| L-5 | low | `Bearer` scheme 區分大小寫 |
| L-6 | low | demo token 無強度檢查、無速率限制 |
| L-7 | low | 種子資料 email 沒正規化 |
| L-8 | low | `PORT` 沒驗證 |
| L-9 | low | role 欄位檢查重複、`req.user!` 非空斷言 |
| L-10 | low | email 沒 trim |
| L-11 | low | 若干延伸邊界測試（viewer 查單筆、PATCH 409、remove 最後 admin 的服務層測試等） |

## 另一個被駁回的意見

修 H-1 時，本機 PostToolUse hook 提出 `remove()` 中「先 `findIndex` 再讀 `this.users[index]`」可能有並行問題。判定**不成立**：JS 單執行緒同步執行，前一行已確認 `index !== -1` 就丟 404，兩行之間陣列不可能被改動。不做修改。
