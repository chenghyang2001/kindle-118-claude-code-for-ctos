# NOTES — 第 11 章 Harness 快速演練

> 快速 demo 模式：沒有經過 QA／code-reviewer 流程，只做了冒煙測試和三項 `claude -p` 實測。

## 做了什麼（四週對應）

| 週 | 書上的目標 | 本專案的做法 | 檔案 |
| --- | --- | --- | --- |
| Week 1 | 專案 CLAUDE.md | 寫專案概述、目錄結構、SQL 只放 migrations/ 等規則 | `CLAUDE.md` |
| Week 2 | 權限 allow / deny | allow：Read/Grep/Glob、`Edit(migrations/**)`、`Edit(scripts/**)`、少數 python/git 指令；deny：`.env`、`secrets/`、`rm -rf`、`git push`、curl/wget、WebFetch | `.claude/settings.local.json` |
| Week 3 | Hook | PreToolUse `guard_sql.py`：Write/Edit/MultiEdit 的 `.sql` 若不在 `migrations/` 底下就 exit 2，原因印到 stderr；PostToolUse `log_write.py`：寫完追加「時間 / 工具 / 路徑」到 `.claude/hook.log` | `.claude/hooks/` |
| Week 4 | 專門的 subagent | `reviewer`：`tools: Read, Grep, Glob`，只能審查不能寫 | `.claude/agents/reviewer.md` |

被管理的小專案：`app.py`（標準庫 http.server，GET /health）、`scripts/seed.py`、`migrations/001_init.sql`（T2 由 Claude 建立）。

## 驗證結果

T0～T3 全部通過，細節見 `VERIFY.md`，原始輸出在 `verify/`。

## 和書上做法的差異

1. **設定層級**：書上的全域或託管設定（`~/.claude/settings.json`、managed settings）一律改寫在專案 `.claude/settings.local.json`。這個檔案預設是個人用、不進版控，這裡是為了演練才 commit。團隊共用時應該放在 `.claude/settings.json`。
2. **Hook 路徑**：用 `$CLAUDE_PROJECT_DIR/.claude/hooks/...` 當成相對於專案的路徑，不寫死使用者目錄。腳本也用 `Path.resolve()` + `is_relative_to()` 判斷，所以 `migrations/../scripts/x.sql` 這種繞路寫法也會被擋，副檔名大小寫也不影響。
3. **權限規則踩坑**：原本寫了 `Write(migrations/**)`，CLI 2.1.308 警告檔案路徑規則只認 `Edit(path)`（Edit 規則涵蓋所有寫檔工具），已改正。書上若有 `Write(path)` 寫法，以目前 CLI 為準。
4. **Hook 失敗策略**：輸入 JSON 解析失敗時 `guard_sql.py` 會放行（exit 0），避免 hook 自己壞掉時卡住所有寫檔。這是我的選擇；如果要更嚴格（fail-closed）可以改成 exit 2。書上沒有指定。
5. **驗證方式**：用 `claude -p --setting-sources project,local` 在非互動模式下跑，並加上 `--permission-mode acceptEdits`，讓 allow 清單以外的寫檔不會卡在權限提示。T3 用 `--output-format stream-json --verbose` 留下工具呼叫紀錄。
6. **數字**：本演練沒有引用書上的量化數字；四週的切分照題目指示，各週實際花費時間未量測。
7. **hook.log 不進版控**（`.gitignore`），驗證時的快照另存在 `verify/hook.log.snapshot`。
8. **沒處理的風險**：hook 只看 `file_path`，所以用 Bash 寫 `.sql`（例如 `echo > x.sql`）不會被擋。要補的話得對 Bash 也加 PreToolUse matcher，或者在 deny 加對應規則。
