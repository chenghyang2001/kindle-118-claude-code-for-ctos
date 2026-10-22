# 第 22 章演練筆記：MCP 優先的未來

> 快速 demo 模式：主 Claude 直接寫，未經 QA／審查流程。

## 做了什麼

| 檔案 | 內容 |
| --- | --- |
| `deploy_mcp.py`（186 行） | stdio MCP server：`list_deployments`（唯讀查詢）、`confirm_deployment`（冪等確認）、resource `deploy://services/status`；每次 tool 呼叫寫 `logs/audit.jsonl`；滑動視窗限流 30 次／60 秒（假設值）；資料檔先寫暫存再取代 |
| `data/deployments.json` | 13 筆假部署紀錄，3 個服務（dep-005 已在驗證時被確認） |
| `tests/test_deploy_mcp.py` | 12 個 pytest（核心純函式＋server 能建立） |
| `.mcp.json` | `claude mcp add --scope project` 產生，用 `.venv/Scripts/python.exe` 相對路徑 |
| `.claude/settings.local.json` | `enabledMcpjsonServers: ["deploy-mcp"]` 免確認 |
| `VERIFY.md` | claude -p 實呼叫紀錄、冪等比對、audit 內容 |
| `templates/` | 四階段導入檢查表、MCP 準備度檢查表、前端／後端 CLAUDE.md 範本 |
| `RETRO.md` | 全書 22 章回顧 |

環境：`uv venv .venv` ＋ `uv pip install mcp pytest`（mcp 2.3.0）。

## 驗證結果

- pytest 12/12 通過
- `claude mcp list`：deploy-mcp ✔ Connected
- claude -p 查詢 billing 3 筆 ✅；確認 dep-005 兩次結果相同（冪等）✅；讀 resource 三個服務 ✅
- audit.jsonl 3 行（1 查詢＋2 確認，第二次記「未變更」）

## 和書上做法的差異

| 書上 | 本演練 | 原因 |
| --- | --- | --- |
| 設定檔寫 `.claude/mcp.json` 或 `mcp-config.json` | 用現行 Claude Code 的專案層 `.mcp.json` | 現在 `--scope project` 產生的就是 `.mcp.json` |
| 連接真實內部系統（Postgres／Datadog／Jira），需要 API 憑證 | 假部署紀錄 JSON | 不用第三方帳號 |
| Tools、Resources、Prompts 三種 | 只做 2 tools＋1 resource，沒做 Prompt | 題目範圍 |
| 破壞性操作要人工批准 | 沒有破壞性操作，只寫進檢查表 | 確認是可重複、無害的操作 |
| 速率限制 | 有實作，30 次／60 秒是假設值 | 書上沒給數字 |
| 書上範例多用 FastMCP | mcp 2.x 已改名 `MCPServer`（`mcp.server.mcpserver`） | 套件已升版 |
| 附錄完整檢查表與 4 種 CLAUDE.md 範本 | 只整理四階段檢查表＋前端／後端兩種；細項門檻標假設值 | 教材筆記只有大綱，資料管道與 monorepo 範本題目沒要求 |

## 過程中的問題

- 假資料產生腳本的跳號邏輯把 web-frontend 全部跳掉，讀 resource 才發現只有兩個服務；補 3 筆後正常。
- 子 session 指出：重複確認時傳入不同確認者沒有警告。可改成回傳 `already_confirmed_by` 欄位提示呼叫方（未做）。

## 已知未處理的風險

- 限流器是行程內記憶體，server 重啟就歸零；多個 client 各開一個 server 時不共享。
- 資料檔沒有鎖，同時兩個 server 寫入可能互相覆蓋。
- audit log 沒有輪替，會一直長大。
