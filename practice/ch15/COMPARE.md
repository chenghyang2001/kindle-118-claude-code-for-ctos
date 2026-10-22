# COMPARE：前置載入（A）vs 只描述需求（B）

同一個需求：**在 order 加 `priority` 欄位（low / normal / high，預設 normal），並提供依優先度查訂單的 API，補測試。**

- A 提示詞：`prompts/a-preload.md`（指定 5 個檔案路徑、型別、函式／路由名稱、要改的路由總數、驗證指令、「不要讀其他檔」）
- B 提示詞：`prompts/b-vague.md`（一句話描述需求）
- 執行方式：`scripts/run-ab.sh <輪次>`，A、B 各在自己的 git worktree（同一個起點 commit）跑
  `claude -p --output-format stream-json --verbose --setting-sources project,local --dangerously-skip-permissions`，prompt 走 stdin，先清掉 `CLAUDE*` 環境變數
- 統計：`node scripts/stats.js`（原始資料在 `runs/*.jsonl`、`runs/stats.json`；改動在 `runs/*.diff`）
- 模型：claude-opus-5-5（Claude Code 2.1.308），每個變體每輪只跑 1 次

## 結果

| 指標 | A 前置載入（r1） | B 只描述需求（r1） | A 前置載入（r2） | B 只描述需求（r2） |
|---|---|---|---|---|
| 工具呼叫總數 | 7 | 4 | 3 | 4 |
| 工具分佈 | Bash×7 | Bash×4 | Bash×3 | Bash×4 |
| 失敗的工具呼叫 | 1 | 0 | 0 | 0 |
| 讀取的不同檔案數 | 5 | 13 | 5 | 13 |
| 寫檔動作次數 | 4 | 1 | 2 | 1 |
| 最終改動檔案數（git diff） | 5 | 4 | 5 | 5 |
| 回合數（num_turns） | 8 | 5 | 4 | 5 |
| input tokens（未快取） | 16 | 10 | 8 | 10 |
| cache read tokens | 247473 | 143136 | 111407 | 142141 |
| cache creation tokens | 20922 | 19243 | 15750 | 17971 |
| output tokens | 4705 | 4140 | 2124 | 3449 |
| token 合計 | 273116 | 166529 | 129289 | 163571 |
| 花費 total_cost_usd（API 計價參考） | $0.3110 | $0.2654 | $0.1908 | $0.2412 |
| 秒數（duration_ms） | 54.2 | 50.9 | 27.4 | 55.3 |
| 秒數（含啟動，wall clock） | 59 | 56 | 32 | 59 |
| 事後 npm test | 36 pass / 0 fail | 37 pass / 0 fail | 35 pass / 0 fail | 37 pass / 0 fail |


> 「讀取的不同檔案數」是從 Bash 指令（`cat`／`sed`／`grep`…）解析出來的啟發式數字：兩個子 session 都沒用 Read 工具，全部用 Bash 讀檔。
> 「花費」是 `claude -p` 回報的 API 計價參考值；本次走訂閱額度，沒有實際扣 API Credits。

## 怎麼解讀

**第 2 輪（排除 CRLF 干擾後）是主要結論：**

| 指標 | A | B | A 相對 B |
|---|---|---|---|
| 讀取檔案數 | 5 | 13 | -62% |
| 回合數 | 4 | 5 | -1 回合 |
| token 合計 | 129,289 | 163,571 | -21% |
| output tokens | 2,124 | 3,449 | -38% |
| 秒數（duration_ms） | 27.4 | 55.3 | -50% |
| 新增／修改行數 | +27 / -2 | +67 / -5 | 改動小很多 |

1. **讀檔數最穩定**：兩輪都是 A 讀 5 個、B 讀 13 個。B 每次都會先 `git ls-files` 掃整個 repo，再讀 lib/、router.js、README、package.json；r1 甚至讀了產生器 `scripts/gen-app.js`，r2 讀了實驗用的 `prompts/b-vague.md`（見下方「干擾因素」）。
2. **第 1 輪 A 反而比較貴**：worktree 在 Windows 上 checkout 成 CRLF，A 照提示詞用精確字串替換改檔，失敗 1 次、重寫 3 次（寫檔動作 4 次、8 回合）。這說明**前置載入省的是「探索」成本，省不了「執行失敗」成本**。加了 `.gitattributes`（`eol=lf`）後第 2 輪 A 一次就改好。
3. **B 的設計會自己發揮**：r1 的 B 做成 `GET /orders?priority=high`（query 參數，所以沒動 router.test.js），r2 的 B 做成 `GET /orders/priority/:priority`；B 也多加了 service 層驗證和更多測試。功能都對、測試都過，但**每次結果不一樣、範圍比較大**。A 兩輪的改動幾乎相同。
4. **兩邊最終測試都全過**（A：35–36 pass；B：37 pass，B 多寫了測試）。

## 干擾因素與限制

- 每個變體每輪只跑 1 次（n=1×2 輪），數字會因模型隨機性浮動，只能看方向，不能當精確比例。要更可靠應每組跑 5 次以上取中位數（次數：假設值）。
- 第 1 輪 B 的起點 commit 比 A 多一個（中途 commit 了 CONTEXT-PLAYBOOK.md），已在第 2 輪改成兩邊固定同一個 BASE commit。
- worktree 裡含 `prompts/`、`scripts/` 與 `CONTEXT-PLAYBOOK.md`，B 探索時可能讀到實驗提示詞本身（r2 確實讀了 `prompts/b-vague.md`）。正式量測應只把 `app/` 放進乾淨的工作樹。
- 讀檔數是從 Bash 指令解析，`cat package.json 2>/dev/null` 這種讀不到的檔也會被算進去（b-r2 的根目錄 `package.json` 實際不存在）。
- 假專案是規則產生的，8 個領域長得幾乎一樣；真實 repo 檔案差異大、文件少，B 的探索成本通常會更高（推論，未實測）。
