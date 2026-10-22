# 分批回填資料（batched backfill）

## 適用情境

- 新欄位加好之後，要把舊資料算出值填進去。
- 資料量大，一次 `UPDATE` 會鎖表或撐爆交易紀錄。
- **不要用**：資料量很小（< 1 萬筆，假設值）直接一條 UPDATE 即可；需要跨服務呼叫 API 才能算出值的回填（改寫成背景 job）。

## 變數

| 變數 | 說明 | 例 |
| --- | --- | --- |
| `{{DB_ENGINE}}` | 資料庫與版本 | PostgreSQL 16 |
| `{{TABLE}}` | 資料表名 | `orders` |
| `{{TARGET_COLUMN}}` | 要回填的欄位 | `discount_cents` |
| `{{SOURCE_EXPR}}` | 計算來源 | `ROUND(discount_rate * total_cents)` |
| `{{BATCH_SIZE}}` | 每批筆數 | 5000 |
| `{{PK}}` | 主鍵欄位 | `id` |

## 提示詞

```prompt
為 {{DB_ENGINE}} 的資料表 {{TABLE}} 寫一支分批回填腳本：
把 {{TARGET_COLUMN}} 設成 {{SOURCE_EXPR}}，只處理 {{TARGET_COLUMN}} IS NULL 的列。

要求：
1. 依 {{PK}} 範圍分批，每批 {{BATCH_SIZE}} 筆，每批獨立交易。
2. 可重複執行（idempotent）：中斷後重跑只處理剩下的列。
3. 每批之間短暫停頓，並印出進度（已處理筆數、目前 {{PK}}）。
4. 提供 --dry-run 只計算筆數不寫入。
5. 不要修改 schema，不要刪除資料。
6. 最後列出：驗證回填完成的 SELECT、預估批數、出錯時如何安全停止。
```

## 範例

變數：`PostgreSQL 16`／`orders`／`discount_cents`／`ROUND(discount_rate * total_cents)`／`5000`／`id`

預期輸出重點：

- 迴圈 `UPDATE ... WHERE id > $last AND id <= $last + 5000 AND discount_cents IS NULL`
- 驗證：`SELECT COUNT(*) FROM orders WHERE discount_cents IS NULL;` 應為 0。

## 維護資訊

- 負責人：＿＿＿
- 最後驗證：未實跑（範本）
