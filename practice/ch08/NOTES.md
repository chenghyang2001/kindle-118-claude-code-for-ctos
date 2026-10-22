# NOTES：K118 第 8 章「氛圍編碼應用的問題」快速演練

> 快速 demo 模式：主 Claude 直接寫檔，未經 code-qa／code-reviewer 審查。

## 做了什麼

1. **建 vibe 原型**（commit `73b1c48`）：`uv add flask` 建 `.venv`，寫 `app.py` 小型留言板，刻意放入：寫死 `SECRET_KEY`／`ADMIN_TOKEN`／假的 `sk_live_` 金鑰、f-string SQL、`/posts` N+1 查詢、`CREATE TABLE IF NOT EXISTS` 代替 migration、SQLite、`debug=True` + `0.0.0.0`、DELETE 不驗證、沒有測試。
2. **稽核**：把書上的英文稽核提示詞原文丟給 `claude -p`（先清掉 `CLAUDE*` 環境變數、加 `--setting-sources project,local`、只開 Read/Grep/Glob），把輸出整理成 `AUDIT.md`：書上六大面向 + 使用者指定的三個補充面向，共 22 項（critical 5／high 10／medium 5／low 2）。
3. **晉升檢查表**：`PROMOTION_CHECKLIST.md`，分三關（阻擋上線／上線前／上線後），含書上的「核心路徑 50% 覆蓋率」與 Sentry。
4. **修掉全部 5 個 critical**：參數化查詢、改用 waitress 並預設 `127.0.0.1`、DELETE 加 Bearer token、密鑰改讀環境變數（缺少就拒絕啟動）+ `.env.example`、補 pytest。順手修 high 的 S5（啟動時印出密鑰）。
5. **其餘 high 以下刻意不修**（N+1、分頁、外鍵、migration 等），留在 checklist，原型裡也加了 `P1 未修` 註解。

## 驗證結果

| 驗證 | 結果 |
| ------ | ------ |
| 原型漏洞實測 | `DELETE /posts/1 OR 1=1` 不帶 token 回 200，整張 posts 表被清空 |
| `uv run pytest` | **12 passed**（SQL injection 回歸 3、授權 3、缺環境變數 2、無寫死密鑰 1、無 debug 1、主要流程 2） |
| 沒設環境變數啟動 | 印出「缺少環境變數：SECRET_KEY, ADMIN_TOKEN」，exit code 1 |
| 設環境變數後用 waitress 啟動 | 只聽 `127.0.0.1`；不帶 token 的 DELETE 回 401，帶 token 回 200 |

## 和書上做法的差異

| 項目 | 書上 | 本演練 |
| ------ | ------ | -------- |
| 六大面向 | 架構一致性、安全、測試覆蓋、相依衛生、效能、資料模型 | 照書上六項；使用者另列的「錯誤處理、可觀測性、部署」放在 AUDIT.md 第二節當補充面向 |
| 稽核對象 | 非技術人員做的真實原型 | 自己寫的、刻意放問題的約 90 行 Flask app，所以稽核一定會找到預期的問題 |
| 測試門檻 | 核心路徑 50% 覆蓋率 | 只補最少測試（12 個），沒裝 `pytest-cov`、沒量覆蓋率；50% 列在 checklist 第 1 關 |
| Sentry | 建議接上錯誤監控 | 需第三方帳號，只在 checklist 附錄寫範本、`.env.example` 留 `SENTRY_DSN` |
| 修復範圍 | 依稽核結果排優先序 | 只修 critical（加一個順手的 high），其餘留給 checklist |
| 輪替外洩密鑰 | — | 未執行；假金鑰仍留在 commit `73b1c48` 的歷史裡（教材刻意保留），已在 checklist 標註 |
| Supabase 案例 | 提到沒有 migration 的資料庫控制台 | 改用 SQLite 的 `CREATE TABLE IF NOT EXISTS` 示範同樣的問題 |

假設值：Sentry 範本裡的 `traces_sample_rate=0.1`、分頁上限 100，書上沒有提到這兩個數字。

## 已知風險

- 輸入驗證沒做：少欄位或送非 JSON 仍會回 500（S6／E1）。
- 作者不存在時 `/posts` 會 500（P1／M1 一起修）。
- `claude -p` 的稽核輸出每次跑都可能不一樣，AUDIT.md 是整理過的版本。
