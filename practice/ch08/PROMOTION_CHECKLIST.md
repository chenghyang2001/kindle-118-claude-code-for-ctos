# 原型晉升生產檢查表（PROMOTION_CHECKLIST.md）

適用於：從「氛圍編碼（vibe-coded）原型」晉升為正式服務之前。每一關全部打勾才能進下一關。
項目 ID 對應 `AUDIT.md`。

## 第 0 關：阻擋上線（critical，全部必過）

- [x] **S1** 所有 SQL 改成參數化查詢（測試：`test_search_injection_returns_nothing` 等 3 個）
- [x] **S2** 不用 Flask debug server；正式啟動走 WSGI server（waitress），預設只聽 `127.0.0.1`
- [x] **S3** 破壞性端點（DELETE）需要授權，token 用 `hmac.compare_digest` 比對
- [x] **S4** 原始碼沒有任何密鑰；缺 `SECRET_KEY`／`ADMIN_TOKEN` 時拒絕啟動；提供 `.env.example`
- [ ] **S4-後續** 舊的三把密鑰已進 git 歷史 → 視為外洩，**全部輪替**；若 repo 曾公開，用 `git filter-repo` 清歷史（本演練未 push，沒有執行）
- [x] **T1** 有自動化測試且全過（目前 12 個）

## 第 1 關：上線前（high）

- [ ] **測試**：核心路徑測試覆蓋率 ≥ **50%**（書上門檻），加 `pytest-cov` 並在 CI 強制
- [ ] **S6／E1** 所有輸入用 schema 驗證（pydantic／marshmallow），錯誤統一回 JSON 400／404／500
- [ ] **P1** `/posts` 的 N+1 改成一次 `LEFT JOIN`
- [ ] **P2** `/posts`、`/search` 加分頁（`limit` 上限 100）
- [ ] **M1** 外鍵 `posts.user_id REFERENCES users(id)`，每條連線開 `PRAGMA foreign_keys=ON`
- [ ] **M2** 導入 migration（Alembic／Flask-Migrate），schema 變更一律走 migration 檔（含 up／down）
- [ ] **O1** 結構化 logging（不可記錄密鑰）＋錯誤監控 **Sentry**（書上建議；需第三方帳號，下方只給範本）
- [ ] **A1／A2** 拆成 Blueprint + 資料存取層；建表從啟動流程移到 migration 指令

## 第 2 關：上線後短期（medium／low）

- [ ] **S7** 速率限制（Flask-Limiter）、安全標頭（Flask-Talisman）
- [ ] **A3** 連線用 `flask.g` + `teardown_appcontext` 管理
- [ ] **D1／D2** CI 跑 `pip-audit`；dev 工具加 ruff
- [ ] **P3** 搜尋改 SQLite FTS5 或 PostgreSQL trigram
- [ ] **M3** `posts.user_id` 索引、`users.email UNIQUE NOT NULL`、加 `created_at`
- [ ] **M4** 多 worker 寫入前從 SQLite 換 PostgreSQL

## 附錄：Sentry 範本（未啟用）

需要 Sentry 帳號與 DSN，本演練只寫範本，不安裝套件：

```python
# uv add "sentry-sdk[flask]"
import os
import sentry_sdk

dsn = os.environ.get("SENTRY_DSN")
if dsn:
    sentry_sdk.init(dsn=dsn, traces_sample_rate=0.1)  # 0.1 為假設值
```
