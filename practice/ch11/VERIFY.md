# VERIFY — K118 第 11 章 Harness 實測結果

- 日期：2026-10-22
- 環境：Windows 11、Claude Code 2.1.308、Python 3.14.7
- 執行方式：先 `unset` 所有 `CLAUDE*` 環境變數，再跑
  `claude -p "<prompt>" --setting-sources project,local --permission-mode acceptEdits`
  （只載入專案層設定，不載入全域 hook）
- 原始輸出存在 `verify/`

## 總表

| # | 情境 | 預期 | 實際 | 結果 |
| --- | --- | --- | --- | --- |
| 0 | 直接餵 JSON 給 `guard_sql.py`（scripts/bad.sql、migrations/001_init.sql 絕對路徑、`migrations/../scripts/x.SQL`、app.py） | 2 / 0 / 2 / 0 | 2 / 0 / 2 / 0 | ✅ |
| 1 | `claude -p` 要求在 `scripts/` 建 `bad.sql` | 被 PreToolUse 擋下，檔案不存在 | hook exit 2，訊息「已阻擋：.sql 檔只能寫在 migrations/ 底下…」；`scripts/` 只有 seed.py | ✅ |
| 2 | `claude -p` 要求在 `migrations/` 建 `001_init.sql` | 寫入成功，`.claude/hook.log` 多一行 | 檔案建立（CREATE TABLE IF NOT EXISTS users），log 有一行 | ✅ |
| 3 | `claude -p` 派 `reviewer` subagent 寫 `scripts/reviewer_note.txt` | subagent 沒有寫入工具，檔案不存在 | reviewer 回「我沒有寫入權限」，subagent tool_uses = 0，主 session Glob 確認檔案不存在 | ✅ |

## T1：scripts/bad.sql 被擋

Claude 收到的錯誤原文（`verify/t1-bad-sql.txt`）：

```
PreToolUse:Write hook error: [python "$CLAUDE_PROJECT_DIR/.claude/hooks/guard_sql.py"]: 已阻擋：.sql 檔只能寫在 migrations/ 底下，收到的路徑是 C:\Users\USER\workspace\k118-ch11-practice\scripts\bad.sql。請改放到 migrations/（例：migrations/002_xxx.sql）。
```

同一次執行也看到 CLI 警告：`Write(path)` 形式的 allow 規則無效，檔案規則只認 `Edit(path)`。已改掉後再跑 T2。

## T2：migrations/001_init.sql 成功 + log

`.claude/hook.log`（快照在 `verify/hook.log.snapshot`）：

```
2026-10-22T13:10:13	Write	C:\Users\USER\workspace\k118-ch11-practice\migrations\001_init.sql
```

T1 被擋的那次沒有留下 log：PreToolUse 擋掉後工具沒執行，PostToolUse 也就不會觸發，符合預期。

## T3：reviewer 不能寫

從 `verify/t3-reviewer.jsonl` 整理：

- init 事件的 agents 清單包含 `reviewer`（從 `.claude/agents/reviewer.md` 載入）
- 主 session 呼叫 `Agent(subagent_type="reviewer")`
- reviewer 回覆：「我沒有寫入權限，`scripts/reviewer_note.txt` 沒有建立。……我的工具清單裡沒有 `Write`、`Edit`，也沒有 Bash 或 PowerShell」
- 主 session 用 `Glob scripts/reviewer_note.txt` 結果為 `No files found`
- 目標特意用 `.txt`，避開 `guard_sql.py`，證明擋下它的是 subagent 的 `tools:` 白名單，而不是 hook
