# K118 第 20 章演練筆記：自動化與內部工具（PR 平行審查）

> 快速 demo 模式：未經 QA／code-reviewer 審查，只求跑通流程。

## 做了什麼

| 檔案 | 用途 |
| --- | --- |
| `.github/workflows/claude-review.yml` | GitHub Actions **範本**：prepare 產 diff → review（matrix 三 job 平行：正確性／資安／規範）→ summarize 彙整並發／更新 PR 留言 |
| `.github/claude-review/prompts/*.md` | 三面向審查 prompt + 共用 JSON 輸出格式（CI 與本機共用） |
| `.github/claude-review/aggregate.py` | 解析三份 `claude -p` 輸出 → 去重、依嚴重度排序 → `REVIEW-REPORT.md`；附 `--self-test` |
| `run_local_review.sh` | 本機重跑整個流程；支援 `--from-git`、`--dry-run`、指定 diff 檔 |
| `demo-app/` | 被審查的小專案（sqlite3 使用者服務 + unittest + `CONVENTIONS.md`） |
| `review.diff` | 埋了明顯問題的修改：SQL 字串拼接、寫死密碼與路徑、裸 `except: pass`、camelCase 命名、檔案／連線未關閉 |
| `review-out/*.json` | 三個審查的原始輸出與解析後 findings |
| `REVIEW-REPORT.md` | 最終彙整報告 |
| `.claude/settings.local.json` | 專案層權限（只允許 Read/Grep/Glob） |

壞的修改只存在 `review.diff`，`demo-app/app/users.py` 已還原為乾淨基準版（commit `4219e90`）。

## 本機執行方式

```bash
./run_local_review.sh            # 審查 review.diff
./run_local_review.sh --from-git # 用目前工作樹的 git diff HEAD 重新產生再審查
```

每個 `claude -p` 呼叫：`--setting-sources project,local`、`--tools`／`--allowedTools` 只給 `Read,Grep,Glob`、
prompt 走 stdin、`--output-format json`、`--no-session-persistence`；執行前清掉所有 `CLAUDE*` 環境變數並 unset `ANTHROPIC_API_KEY`。

## 驗證結果（2026-10-22）

| 項目 | 結果 |
| --- | --- |
| demo-app 單元測試 | 3/3 通過 |
| `aggregate.py --self-test` | 通過（同檔同 tag 行距 ≤2 合併、保留較高嚴重度、去除 ```json 圍欄） |
| workflow YAML | pyyaml（專案 `.venv`）解析成功：3 個 job、matrix 3 面向 |
| 第 1 次實跑 | 三審查成功（28 秒）；彙整失敗——Git Bash 有 `MSYS_NO_PATHCONV=1`，`/c/Users/...` 傳給 Windows python 變成 `C:\c\Users\...`。改傳相對路徑修正 |
| 第 2 次完整重跑 | 三審查平行 30 秒，原始 25 項 → 去重 13 項（Critical 3、High 5、Medium 4、Low 1） |
| 埋設的問題是否都抓到 | ✅ SQL 注入 ×2、寫死密碼、寫死路徑、裸 except、命名違規、資源未關閉，全部命中；另外抓到 `login` 失敗回傳 None、`join` 非字串 TypeError、刪除無授權檢查 |
| 子 session 副作用 | 無（`git log` 沒有多出 commit，證實 `--setting-sources project,local` 擋掉全域 Stop hook） |
| 單次費用（`total_cost_usd` 估算） | 正確性 $0.26、資安 $0.24、規範 $0.07，合計約 $0.57／次（本機實測值，走訂閱額度不實際扣款） |

**跨面向交叉確認**很有用：報告中多數 Critical/High 都被 2～3 個面向同時抓到，「抓到的面向」欄位可當可信度指標。

## 已知限制

- 去重靠「檔案 + tag + 行距 ≤ 2」的規則，語意相同但 tag 不同的項目不會合併（例：`login` 被分成 `auth` 與 `logic` 兩項）。要更精準可加第 4 個 `claude -p` 做語意合併，代價是多一次呼叫與非決定性。
- 每次結果項數會浮動（23 → 25 項），LLM 審查本質上非決定性；CI 不應以「項數」當 gate，頂多以「有無 critical」阻擋合併。
- workflow 中截斷 2000 行 diff、`--max-turns 8` 都是**假設值**，書上沒有給。
- `claude-code-action@v1` 的參數名稱只寫成註解範本，未實際在 GitHub 上驗證。

## 和書上做法的差異

| 書上／常見做法 | 本次演練 | 原因 |
| --- | --- | --- |
| 在真實 repo 用 `/install-github-app` 或 Console 建 API Key、設 secrets | 只寫 `secrets.ANTHROPIC_API_KEY` 範本，不 push、不接 GitHub | 演練限制：不建 repo、不設 API Key |
| CI 內 `claude -p` 讀 repo 設定 | 本機加 `--setting-sources project,local`（CI 用 `project`） | 排除全域 hook，避免子 session 自己 commit |
| prompt 直接當位置參數 | prompt 走 stdin | `--allowedTools`／`--tools` 是可變長參數，會吃掉後面的 prompt |
| 可直接用官方 `anthropics/claude-code-action` 讓它自己留言 | 用原生 `claude -p` + 自寫 `aggregate.py`，官方 action 寫成註解替代方案 | 三個平行 job 要合併成「一則」去重留言，自己控輸出格式較容易；本機也能用同一套 prompt 重跑 |
| 彙整用另一個 LLM | 彙整用決定性 Python 規則 | 可重現、免費、可單元測試 |
| — | PR 留言用 `<!-- claude-review -->` 標記做 upsert | 避免每次 push 都新增一則留言洗版 |
