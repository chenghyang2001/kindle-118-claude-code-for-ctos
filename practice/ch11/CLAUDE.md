
## 本專案例外

本專案是 Kindle 書籍教學 demo（kindle-drill 快速模式），豁免全域「程式碼三 agent 鐵律」：主 Claude 直接寫檔，不派 code-writer／code-qa／code-reviewer；不需詢問複雜度，也不需詢問是否使用快速模式（已選快速模式）。
所有選擇題一律採用推薦選項、不要停下來問使用者；不可修改全域 `~/.claude/settings.json`，設定一律寫在本專案的 `.claude/settings.local.json`。

## 專案概述（Harness Week 1）

最小 Python 服務（`app.py`，GET /health）＋兩個資料夾，用來演練 K118 第 11 章的 Harness 四週計畫。

```
app.py              # 服務本體（標準庫 http.server）
migrations/         # 唯一允許放 .sql 的地方，檔名 NNN_描述.sql
scripts/            # Python 維運腳本（不可放 .sql）
.claude/
  settings.local.json  # Week 2 權限 + Week 3 hooks
  hooks/               # guard_sql.py（PreToolUse）、log_write.py（PostToolUse）
  agents/reviewer.md   # Week 4 唯讀審查 subagent
```

## 規則

- SQL 一律寫成 `migrations/NNN_描述.sql`，用 `CREATE TABLE IF NOT EXISTS` 保持可重跑；寫在其他地方會被 hook 擋下。
- 不讀 `.env` / `secrets/`，不 `git push`，不對外連網。
- 審查任務交給 `reviewer` subagent（唯讀）。
- 執行：`python app.py`，測試：`curl http://127.0.0.1:8000/health`（由人手動跑，Claude 被 deny curl）。
