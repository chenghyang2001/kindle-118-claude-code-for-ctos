# NOTES：K118 第 15 章「大規模脈絡管理」快速演練紀錄

日期：2026-10-22｜模式：快速 demo 模式（未經 QA／審查）｜模型：claude-opus-5-5（Claude Code 2.1.308）

## 做了什麼

| 產出 | 說明 |
| --- | --- |
| `CONTEXT-PLAYBOOK.md` | 團隊守則：一任務一 session、顯性前置載入、≥3 檔強制 Plan 模式、/compact 與 /clear 的判斷訊號、決策流程圖 |
| `scripts/gen-app.js` | 產生 `app/` 假專案：8 個領域（user、customer、product、order、invoice、shipment、review、coupon）× model／service／route／test，加 lib、router，共 **39 個檔案**、33 個測試（Node 24 內建 `node:test`，零依賴） |
| `prompts/a-preload.md`、`prompts/b-vague.md` | 同一需求（order 加 `priority` + 依優先度查詢 API）的兩種提示詞 |
| `scripts/run-ab.sh <輪次>` | 兩個變體各開一個 git worktree（同一個起點 commit），用 `claude -p --output-format stream-json --verbose --setting-sources project,local` 跑，prompt 走 stdin、先清 `CLAUDE*` 環境變數，事後存 diff 與 `npm test` 結果 |
| `scripts/stats.js` | 解析 stream-json：工具呼叫、失敗次數、讀檔數（含從 Bash 指令解析）、寫檔次數、回合、token、秒數；`--self-test` 冒煙測試 |
| `COMPARE.md` | 兩輪 A/B 結果表格與解讀 |
| `runs/` | 原始 stream-json、diff、測試輸出、`stats.json` |

## 驗證結果

- 假專案：`cd app && npm test` → 33 pass / 0 fail。
- `node scripts/stats.js --self-test` 通過；`bash -n scripts/run-ab.sh` 通過。
- A/B 共跑 2 輪 4 次，四次事後 `npm test` 都 0 fail。
- 第 2 輪主要結論：A 讀 5 個檔、B 讀 13 個；A 的 token 少 21%、時間少 50%、改動行數不到 B 的一半。完整表格見 `COMPARE.md`。
- 子 session 沒有自己 commit（`--setting-sources project,local` 有效排除了全域 Stop hook）。

## 過程中踩到的問題

1. **Git for Windows 路徑轉換**：Git Bash 把 `/c/Users/...` 傳給 `git worktree add`，被建到 `C:/c/Users/...`。改用 `cygpath -m` 轉成 `C:/...` 再傳。誤建的空目錄已刪（`C:/c` 底下原本就有的其他東西沒碰）。
2. **CRLF 讓 A 的改檔失敗**：worktree checkout 成 CRLF，A 照提示詞用精確字串替換，失敗後重試 3 次，第 1 輪 A 反而比 B 貴。加 `.gitattributes`（`* text=auto eol=lf`）後跑第 2 輪排除。第 1 輪的數據保留在 COMPARE.md 當反例。
3. **子 session 只用 Bash**：在 `--dangerously-skip-permissions` 下，子 session 全用 `cat`／`node -e`／Python heredoc 讀寫檔，沒用 Read／Edit 工具。統計腳本改成從 Bash 指令解析讀檔（啟發式，會把讀不到的檔也算進去）。
4. **產生器刪除 app/ 時 EPERM**：Windows 上目錄被當 cwd 時不能刪，改成只清內容不刪目錄本身。
5. `node --test test/` 在 Node 24 會把目錄當檔案，改用 `node --test "test/*.test.js"`。

## 和書上做法的差異

- **設定範圍**：照共通限制，沒有改任何全域 `~/.claude/` 設定；書上若寫全域或託管設定，本演練一律只寫在專案層或寫成範本。本章實際上不需要新增任何設定檔。
- **門檻數字**：PLAYBOOK 裡「≥3 個檔案用 Plan 模式」來自本次任務要求；「脈絡用量 > 70% 時 /compact」「修兩三輪還在繞就 /clear」「每組跑 5 次以上」等數字都是**假設值**，已在文中標註。
- **量測方式**：書上的前置載入是互動式 session 的寫提示詞習慣；本演練改用 `claude -p` 非互動模式 + stream-json 量化比較，並用 git worktree 隔離兩個變體，方便重複執行。
- **權限**：為了無人值守執行用了 `--dangerously-skip-permissions`，只在一次性 worktree 裡使用；實務上應改用 `--allowedTools` 白名單（prompt 一樣走 stdin）。
- **樣本數**：每個變體每輪只跑 1 次，結果只能看方向，不能當精確比例。

## 已知沒處理的風險（快速模式）

- 讀檔數是啟發式解析，只認 `cat/head/tail/sed/grep/wc` 等指令後面的檔名。
- worktree 裡含實驗用的 `prompts/`，B 有讀到自己的提示詞檔（r2），正式量測應只放 `app/`。
- 沒有 push、沒有建 repo（照限制）。
