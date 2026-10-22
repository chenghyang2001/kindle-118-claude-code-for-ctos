# NOTES.md — 第 19 章「部署 Claude Code」演練紀錄（快速模式）

## 做了什麼

| 檔案 | 內容 |
| --- | --- |
| `DEPLOYMENT.md` | 四種部署路徑（CLI＋Pro/Max、CLI＋API Key、Agent SDK、Managed Agents）比較表：適用規模、計費、管控、資安、稽核、資料駐留、設定步驟；依團隊情境的選擇建議與共通紅線 |
| `KEY-ROTATION-RUNBOOK.md` | API 金鑰輪替 SOP：頻率、雙金鑰零停機步驟、驗證、回滾、緊急撤銷、預防 |
| `CISO-SPEND-CHECKLIST.md` | CISO 審查與支出控制檢查表（帳號憑證、資料保護、權限、稽核、支出、簽核欄） |
| `templates/settings.project.example.json` | 專案層權限範本（allow／ask／deny） |
| `templates/README.md` | 範本說明（JSON 不能寫註解，說明放這裡） |
| `env.example` | CI 環境變數範本，只有變數名與 `<佔位符>` |
| `check_templates.py` | 標準庫驗證腳本：JSON 合法性＋金鑰樣式掃描，內含冒煙測試 |
| `.gitignore` | 排除 `.env`、`.venv/` 與當機殘留檔 |

## 驗證結果

- `uv venv .venv` 建立專案虛擬環境（腳本只用標準庫，沒有安裝套件）。
- `uv run --no-project python check_templates.py` → `[PASS]`，exit 0。
- 錯誤案例：餵 `ANTHROPIC_API_KEY=sk-ant-api03-FAKE...` → 回報「疑似真金鑰」與「應為空或佔位符」兩項；不存在的目錄 → 回報「找不到目錄」。
- 沒有執行 `claude -p`：本章產出都是文件與範本，腳本已直接驗證，不需要子 session。

## 和書上做法的差異

| 書上 | 本演練 | 原因 |
| --- | --- | --- |
| `export ANTHROPIC_API_KEY="sk-ant-api03-..."` | 只寫範本 `env.example`，值是 `<佔位符>` | 限制：不設 ANTHROPIC_API_KEY、不填真值 |
| 在 Anthropic Console 建組織／工作區、設硬性支出上限 | 只寫成步驟與檢查項目 | 需要 Console 管理員帳號，依限制只寫範本 |
| `.claude/settings.json` 當作「託管」工具權限檔 | 改成專案層範本 `templates/settings.project.example.json` | 限制：不碰全域或託管設定 |
| 檔名 `.env.example` | 改為 `env.example` | 本機權限設定禁止 Write 工具寫入 `.env*` 檔；沒有繞過該規則。附帶好處：不會被範本裡的 `Read(./.env.*)` deny 擋住 |
| Bedrock / Vertex AI 帳號 | 只在範本中註解列出變數名 | 需第三方帳號 |
| 書上沒給輪替頻率、支出金額、告警門檻 | 文件中的數字一律標「假設值」 | 依規則：書上沒有的數字標假設值 |

## 已知沒處理的風險（快速模式，未經 QA／審查）

- 權限規則語法（如 `Bash(git diff:*)`）依現行 Claude Code 文件撰寫，沒有在子 session 實測每一條是否生效。
- 金鑰掃描只認 `sk-ant-` 與 AWS `AKIA` 樣式，不是完整的 secret scanner。
- Managed Agents 的計費與功能以官方最新定價頁為準，本文件未查證即時價格。
