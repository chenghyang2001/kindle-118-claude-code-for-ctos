# 第 16 章演練筆記

## 做了什麼

1. **建小專案**：Node（CommonJS）＋內建 `node:test`，模組 `src/calc.js`、`src/strings.js`、`src/index.js`，初始 6 個測試。不需安裝任何套件。
2. **Mode 2 子代理**：一次 `claude -p`（`--setting-sources project,local`、`--output-format stream-json`），要求同一則回覆平行派 2 個子代理：
   - A 寫 `test/strings.edge.test.js`（8 個邊界測試）
   - B 寫 `docs/API.md`
3. **Mode 3 git worktrees**：在 `.worktrees/a`、`.worktrees/b` 建 `feature/a`、`feature/b`，兩個 `claude -p` 背景同時跑：
   - a：`calc.multiply`、`calc.power`＋測試
   - b：`strings.truncate`＋測試
   - 兩邊都刻意建立 `CHANGELOG.md`，用來演練衝突
   - 依序 merge（`--no-ff`）→ 解衝突 → 跑測試 → `worktree remove` → 刪分支
4. **唯讀提問 session**：寫 `.claude/readonly-session.settings.json`，並用一次 `claude -p` 驗證寫檔會被擋。
5. 寫 `PARALLEL.md` 比較三種模式。

## 驗證結果

| 檢查 | 結果 |
| --- | --- |
| 初始測試 | 6/6 通過 |
| Mode 2：stream-json 中頂層 Agent 呼叫數 | 2 個，位於同一則 assistant message（平行），見 `logs/mode2-verify.txt` |
| Mode 2 後測試 | 14/14 通過 |
| Mode 3：兩個 session 平行時間 | 共 31 秒（a 24 秒、b 31 秒） |
| Mode 3：merge | feature/a 快轉無衝突；feature/b 在 CHANGELOG.md 出現 add/add 衝突，保留兩條紀錄解決 |
| Mode 3 合併後測試 | 24/24 通過 |
| 清理 | `git worktree list` 只剩 master，兩個分支已刪 |
| 唯讀 session | 寫檔請求被拒，`hello.txt` 未建立；讀檔問答正常 |
| 子 session 自行 commit？ | 沒有（因為加了 `--setting-sources project,local`，全域 Stop hook 未載入） |

## 和書上做法的差異

- **只示範三種模式**（Mode 2、Mode 3、唯讀＋開發 session），書上其他平行化模式未實作。
- 書上多半是互動式操作（開多個終端機分頁）；這裡全部改用 `claude -p` 非互動執行，方便留下紀錄與自動驗證。Mode 3 用 shell 背景執行（`&` ＋ `wait`）代替多個分頁。
- worktree 放在專案內的 `.worktrees/`（已加進 `.gitignore`），不是書上常見的兄弟目錄。
- 在 Git Bash 下 worktree 路徑先用 `cygpath -m` 轉成 `C:/...` 形式，否則會建到錯誤位置。
- `claude -p` 前先清掉所有 `CLAUDE*` 環境變數，並加 `--setting-sources project,local` 排除全域設定與 hook。
- 權限全部寫在專案 `.claude/settings.local.json` 與 `.claude/readonly-session.settings.json`，沒有動全域 `~/.claude/`。
- 成本／時間數字是本機單次實測，書上若有不同數字以書為準；未精確量測者在 `PARALLEL.md` 標「假設值」。

## 小插曲

- `node --test test/` 在 Node 24 會把 `test/` 當成檔案而失敗，改成 `node --test`（自動找 `*.test.js`）。
- Mode 2 的文件子代理沒有 `node` 執行權限，範例輸出是對照原始碼確認，未實際執行。
- `logs/*.jsonl`（完整 stream-json）含本機絕對路徑，已 gitignore，只 commit 摘要 `logs/mode2-verify.txt`。
