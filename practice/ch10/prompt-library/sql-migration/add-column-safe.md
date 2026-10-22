# 安全新增欄位（可回滾的 migration）

## 適用情境

- 要在**既有、已有資料**的資料表加欄位。
- 需要 up／down 兩支 migration，且上線時不能鎖表太久。
- **不要用**：從頭設計整個 schema（書上 ANTI_PATTERN：不讓 AI 從頭設計 DB Schema）；改主鍵或拆表。

## 變數

| 變數 | 說明 | 例 |
| --- | --- | --- |
| `{{DB_ENGINE}}` | 資料庫與版本 | PostgreSQL 16 |
| `{{TABLE}}` | 資料表名 | `orders` |
| `{{COLUMN_SPEC}}` | 欄位名、型別、是否可為 NULL、預設值 | `discount_cents INTEGER NULL` |
| `{{MIGRATION_TOOL}}` | migration 工具與檔名規則 | Knex，`YYYYMMDDHHMMSS_name.js` |
| `{{ROW_COUNT}}` | 資料表大約筆數 | 約 2,000 萬筆 |

## 提示詞

```prompt
你要為 {{DB_ENGINE}} 寫一組 migration，用 {{MIGRATION_TOOL}}。
目標：在資料表 {{TABLE}}（{{ROW_COUNT}}）新增欄位 {{COLUMN_SPEC}}。

要求：
1. 先讀現有 migration 目錄，沿用命名與風格，不要改舊 migration。
2. up：新增欄位時避免整表重寫與長時間鎖表；若需要 NOT NULL，拆成「加可為 NULL 欄位 → 回填 → 加約束」多步。
3. down：完整回滾，執行後 schema 與 up 之前一致。
4. 不要順手修改其他資料表或索引。
5. 輸出 migration 檔，並在最後列出：鎖表風險、預估執行時間的判斷依據、上線前要在 staging 驗證的指令。
```

## 範例

變數：`PostgreSQL 16`／`orders`／`discount_cents INTEGER NULL`／`Knex`／`約 2,000 萬筆`

預期輸出重點：

- `ALTER TABLE orders ADD COLUMN discount_cents INTEGER NULL;`（PG 11+ 加可為 NULL、無預設值欄位不重寫表）
- down：`ALTER TABLE orders DROP COLUMN discount_cents;`
- 風險說明提到 `lock_timeout` 設定。

## 維護資訊

- 負責人：＿＿＿
- 最後驗證：未實跑（範本）
