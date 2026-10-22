# 生產就緒度稽核報告（AUDIT.md）

- 稽核對象：`app.py`（稽核前版本 commit `73b1c48`）、`pyproject.toml`、`uv.lock`
- 稽核方式：用書上第 8 章的英文稽核提示詞跑 `claude -p`（只開 Read/Grep/Glob，`--setting-sources project,local`），原始輸出整理成本表；另加使用者指定的三個補充面向
- 嚴重度定義：**critical** 不修不能上線／可被直接利用；**high** 上線前必修；**medium** 上線後短期內修；**low** 有空再改

## 一、總覽（書上六大面向）

| # | 面向 | 嚴重度 | 一句話結論 |
| --- | ------ | -------- | ----------- |
| 1 | 架構一致性（separation of concerns） | high | 路由、SQL、設定、建表全擠在一個檔案 |
| 2 | 安全（secrets／auth／input validation） | **critical** | 全面 SQL injection、刪除不需授權、debug 對外、密鑰寫死 |
| 3 | 測試覆蓋率 | **critical** | 關鍵路徑覆蓋率 0%，沒裝測試框架 |
| 4 | 套件相依衛生 | medium | 依賴精簡、有 lock 檔，但沒有 dev 群組與漏洞掃描 |
| 5 | 效能（N+1／分頁／bundle） | high | `/posts` N+1 查詢、沒分頁 |
| 6 | 資料模型（索引／migration／外鍵） | high | 沒外鍵、沒索引、沒 migration、沒欄位約束 |

## 二、補充面向（使用者指定，書上提示詞沒有）

| # | 面向 | 嚴重度 | 一句話結論 |
| --- | ------ | -------- | ----------- |
| 7 | 錯誤處理 | high | 少欄位、非 JSON、作者不存在都直接 500 |
| 8 | 可觀測性 | high | 只有一行 `print`（還印出密鑰），沒有 log、沒有錯誤監控（書上建議 Sentry） |
| 9 | 部署 | **critical** | `app.run(debug=True, host="0.0.0.0")` 當正式啟動方式（與 S2 同一問題） |

## 三、詳細發現

| ID | 面向 | 嚴重度 | 位置（稽核前） | 發現 | 建議 | 狀態 |
| ---- | ------ | -------- | ------ | ------ | ------ | ------ |
| S1 | 安全 | critical | `app.py` 全部 5 處 SQL | f-string 拼接 SQL，實測 `DELETE /posts/1 OR 1=1` 清空整張表 | 全改參數化查詢 `?` | ✅ 已修 |
| S2 | 安全／部署 | critical | `app.run(...)` | `debug=True` + `0.0.0.0`，Werkzeug debugger 對外＝遠端執行程式碼 | 關 debug，改用 WSGI server（waitress） | ✅ 已修 |
| S3 | 安全 | critical | `DELETE /posts/<pid>` | 完全不驗證身分，`ADMIN_TOKEN` 定義了卻沒用 | Bearer token + `hmac.compare_digest` | ✅ 已修 |
| S4 | 安全 | critical | 檔頭三個常數 | `SECRET_KEY`、`ADMIN_TOKEN`、`PAYMENT_API_KEY` 寫死且已進 git 歷史 | 改讀環境變數，缺少就拒絕啟動；三把金鑰視為已外洩須輪替 | ✅ 已修（輪替與清歷史見 checklist） |
| T1 | 測試 | critical | 專案層級 | 0 個測試、沒有 pytest | 補 pytest：注入回歸、授權、主要流程 | ✅ 已修（12 個測試） |
| S5 | 安全 | high | `__main__` | 啟動時把 `SECRET_KEY` 印到 stdout | 刪掉 | ✅ 已修（順手） |
| S6 | 安全 | high | 3 個寫入／搜尋端點 | 沒有輸入驗證，少欄位 `KeyError` 回 500 | schema 驗證，錯誤回 400 | ⏳ 未修 |
| S7 | 安全 | medium | 全域 | 沒有速率限制、安全標頭 | Flask-Limiter／Talisman | ⏳ 未修 |
| A1 | 架構 | high | 全檔 | 沒分層、沒 app factory | `create_app()` + Blueprint + 資料存取層 | 🟡 部分（已改 `create_app()`，未拆層） |
| A2 | 架構 | high | `init_db()` | 只在 `__main__` 建表，用 WSGI 啟動時表不存在 | 改用 migration／CLI 指令 | 🟡 部分（`create_app()` 會建表，仍無 migration） |
| A3 | 架構 | medium | `db()` | 連線從不關閉 | `flask.g` + `teardown_appcontext` | ⏳ 未修 |
| D1 | 相依 | medium | `pyproject.toml` | 沒有 dev 群組、沒有 WSGI server、沒跑漏洞掃描 | dev 群組 + `pip-audit` | 🟡 部分（已加 dev 群組與 waitress） |
| D2 | 相依 | low | `uv.lock` | 稽核時未查 CVE 資料庫 | CI 跑 `pip-audit` | ⏳ 未修 |
| P1 | 效能 | high | `/posts` | N+1：N 篇文章查 N+1 次；作者不存在時 `TypeError` 500 | 一次 `LEFT JOIN` | ⏳ 未修 |
| P2 | 效能 | high | `/posts`、`/search` | 沒有分頁 | `limit`/`offset`，上限 100 | ⏳ 未修 |
| P3 | 效能 | medium | `/search` | `LIKE '%q%'` 必定全表掃描 | SQLite FTS5 或 PostgreSQL trigram | ⏳ 未修 |
| M1 | 資料模型 | high | 建表 SQL | 沒外鍵、沒開 `PRAGMA foreign_keys` | 加 FK + 刪除策略 | ⏳ 未修 |
| M2 | 資料模型 | high | 建表 SQL | 沒 migration，`CREATE TABLE IF NOT EXISTS` 無法演進 | Alembic／Flask-Migrate | ⏳ 未修 |
| M3 | 資料模型 | medium | 建表 SQL | `posts.user_id` 無索引、`email` 無 UNIQUE、欄位可為 NULL | 索引 + 約束 + `created_at` | ⏳ 未修 |
| M4 | 資料模型 | low | `DB = "app.db"` | 相對路徑；SQLite 不適合多 worker 寫入 | `DATABASE_PATH` 環境變數；正式環境換 PostgreSQL | 🟡 部分（已改讀環境變數） |
| E1 | 錯誤處理 | high | 全部端點 | 沒有 try/except，也沒有統一錯誤回應 | errorhandler 回 JSON 400/404/500 | ⏳ 未修 |
| O1 | 可觀測性 | high | 全域 | 沒有 logging、沒有錯誤監控 | `logging` + Sentry（書上建議） | ⏳ 未修（Sentry 只寫進 checklist 範本） |

## 四、統計

| 嚴重度 | 數量 | 已修 | 部分 | 未修 |
| -------- | ------ | ------ | ------ | ------ |
| critical | 5 | 5 | 0 | 0 |
| high | 10 | 1 | 2 | 7 |
| medium | 5 | 0 | 1 | 4 |
| low | 2 | 0 | 1 | 1 |

> S2 同時算在「安全」與「部署」面向，表內只列一次。
