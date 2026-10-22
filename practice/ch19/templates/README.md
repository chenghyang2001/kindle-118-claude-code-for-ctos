# templates/ — 專案層權限設定範本說明

JSON 不能寫註解，所以 `settings.project.example.json` 的說明集中在這裡。

## 怎麼用

1. 複製到專案根目錄：`cp templates/settings.project.example.json .claude/settings.json`
2. 依專案語言調整 `allow` 清單（例：Python 專案保留 `uv run pytest`，刪掉 `npm`）。
3. 把 `.claude/settings.json` commit 進版控，所有人共用；個人偏好放 `.claude/settings.local.json`（不進版控）。

> 書上寫的是「託管設定（managed settings）」，那需要管理員權限寫到系統層。本演練依限制**改成專案層**範本，不碰全域或託管設定。

## 欄位說明

| 欄位 | 說明 |
| --- | --- |
| `$schema` | 讓編輯器提供自動完成與驗證 |
| `permissions.defaultMode` | `default`：未列出的動作都要詢問 |
| `permissions.allow` | 免詢問即可執行：唯讀工具、git 查詢、跑測試與 lint |
| `permissions.ask` | 每次都要人工確認：改檔、commit、安裝套件 |
| `permissions.deny` | 一律禁止，優先順序最高 |
| `env.DISABLE_TELEMETRY` | 示範可在專案層設環境變數；**絕不在這裡放 `ANTHROPIC_API_KEY`** |

## deny 清單的理由

| 規則 | 為什麼 |
| --- | --- |
| `Read(./.env)`、`Read(./.env.*)`、`Read(./secrets/**)` | 防止金鑰被讀進對話內容 |
| `Read(./**/*.pem)`、`Read(./**/*.key)` | 憑證與私鑰 |
| `Bash(git push:*)` | 推送需人工在終端機執行，避免 Agent 直接改遠端 |
| `Bash(rm -rf:*)` | 破壞性刪除 |
| `Bash(curl:*)`、`Bash(wget:*)`、`WebFetch` | 防止資料外送或下載未審查的腳本 |

## 注意

- 環境變數範本命名為 `env.example`（不以 `.env` 開頭），才不會被 `Read(./.env.*)` 這條 deny 擋住。
- MCP server／plugin 請以 `--scope project` 安裝，設定才會跟著專案走並可審查。
- 驗證：執行 `python check_templates.py` 會檢查本目錄所有 JSON 是否合法。
