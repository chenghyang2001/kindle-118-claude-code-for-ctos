# Claude PR 審查報告

去重後 **13** 項（原始 25 項）：🔴 Critical 3、🟠 High 5、🟡 Medium 4、🔵 Low 1

| 面向 | 原始項數 | 狀態 |
| --- | ---: | --- |
| 正確性 | 7 | ✅ |
| 資安 | 8 | ✅ |
| 規範 | 10 | ✅ |

| # | 嚴重度 | 位置 | 問題 | 抓到的面向 |
| ---: | --- | --- | --- | --- |
| 1 | 🔴 Critical | `demo-app/app/users.py:40` | 管理員密碼寫死在原始碼中 | 資安、規範 |
| 2 | 🔴 Critical | `demo-app/app/users.py:45` | SearchUsers 以字串串接 SQL,存在 SQL 注入 | 資安、規範 |
| 3 | 🔴 Critical | `demo-app/app/users.py:51` | deleteUser 以字串串接 SQL 且無任何授權檢查 | 資安、規範 |
| 4 | 🟠 High | `demo-app/app/users.py:53` | deleteUser 用裸 except 吞掉所有例外 | 正確性、資安、規範 |
| 5 | 🟠 High | `demo-app/app/users.py:64` | export_users 未關閉檔案與資料庫連線，且回讀時寫入尚未 flush | 正確性、資安、規範 |
| 6 | 🟠 High | `demo-app/app/users.py:58` | login 僅比對共用管理員密碼、忽略使用者名稱且比對方式不安全 | 資安、規範 |
| 7 | 🟠 High | `demo-app/app/users.py:57` | login 在密碼錯誤時隱式回傳 None | 正確性 |
| 8 | 🟠 High | `demo-app/app/users.py:66` | 對 sqlite 資料列 join 會因非字串欄位而拋 TypeError | 正確性 |
| 9 | 🟡 Medium | `demo-app/app/users.py:41` | 資料庫路徑寫死為特定使用者的 Windows 路徑 | 資安、規範 |
| 10 | 🟡 Medium | `demo-app/app/users.py:44` | 函式名 SearchUsers 未使用 snake_case，且缺 docstring | 資安、規範 |
| 11 | 🟡 Medium | `demo-app/app/users.py:45` | LIKE 搜尋把 keyword 直接串接，遇到單引號或 None 會出錯 | 正確性 |
| 12 | 🟡 Medium | `demo-app/app/users.py:49` | deleteUser、userId 未使用 snake_case，且缺 docstring | 規範 |
| 13 | 🔵 Low | `demo-app/app/users.py:51` | deleteUser 無法得知是否真的刪除了資料 | 正確性 |

## 詳細說明

### 1. [🔴 Critical] 管理員密碼寫死在原始碼中
- 位置：`demo-app/app/users.py:40`　標籤：`hardcoded-secret`
- 說明：ADMIN_PASSWORD 以明文常數寫入程式碼並進入版本控制,任何能讀取 repo 的人都能取得管理員密碼。檔案上方已有 get_admin_password() 從環境變數讀取的安全作法,此處反而退步。
- 建議：刪除此常數,改用既有的 get_admin_password() 從環境變數取得,例如 `if hmac.compare_digest(password, get_admin_password()):`。已外洩的密碼應立即更換。

### 2. [🔴 Critical] SearchUsers 以字串串接 SQL,存在 SQL 注入
- 位置：`demo-app/app/users.py:45`　標籤：`sql-injection`
- 說明：keyword 直接拼進 SQL 的 LIKE 條件,攻擊者可傳入 `' UNION SELECT ...` 等內容竊取或竄改資料。
- 建議：使用參數化查詢:`conn.execute("SELECT id, name, email FROM users WHERE name LIKE ?", (f"%{keyword}%",)).fetchall()`

### 3. [🔴 Critical] deleteUser 以字串串接 SQL 且無任何授權檢查
- 位置：`demo-app/app/users.py:51`　標籤：`sql-injection`
- 說明：userId 經 str() 後直接拼入 DELETE 語句,若傳入 `1 OR 1=1` 會刪除整張 users 表;且函式不檢查呼叫者身分,任何人皆可刪除使用者資料。
- 建議：改用 `conn.execute("DELETE FROM users WHERE id = ?", (int(userId),))`,並在函式入口加入呼叫者的管理員權限驗證。

### 4. [🟠 High] deleteUser 用裸 except 吞掉所有例外
- 位置：`demo-app/app/users.py:53`　標籤：`error-handling`
- 說明：刪除失敗（例如資料庫鎖定、SQL 錯誤）時沒有 rollback、沒有記錄，也沒有通知呼叫端。呼叫端會以為刪除成功。裸 except 還會吞掉 KeyboardInterrupt 和 SystemExit。
- 建議：只捕捉 sqlite3.Error，先 conn.rollback()，再用 logging.exception 記錄並重新拋出，或回傳成功與否的布林值。

### 5. [🟠 High] export_users 未關閉檔案與資料庫連線，且回讀時寫入尚未 flush
- 位置：`demo-app/app/users.py:64`　標籤：`resource-leak`
- 說明：寫入用的 f 從未 close，conn 也未關閉。第 67 行在 f 還沒 flush 或關閉時就用 open(path).readlines() 回讀，行數可能不正確。回讀用的 open 也沒有關閉。發生例外時資源同樣不會釋放。
- 建議：用 `with contextlib.closing(sqlite3.connect(DB_PATH)) as conn, open(path, 'w', newline='', encoding='utf-8') as f:` 包住寫入。以計數器累計筆數後回傳，不要回讀檔案。

### 6. [🟠 High] login 僅比對共用管理員密碼、忽略使用者名稱且比對方式不安全
- 位置：`demo-app/app/users.py:58`　標籤：`auth`
- 說明：任何使用者名稱只要提供該密碼即通過;使用 == 做明文比對有時序攻擊風險;失敗時隱含回傳 None 而非 False,容易造成判斷錯誤。
- 建議：改為依使用者名稱查詢雜湊密碼並以 bcrypt/argon2 驗證,或至少使用 `hmac.compare_digest`,並明確 `return False`。

### 7. [🟠 High] login 在密碼錯誤時隱式回傳 None
- 位置：`demo-app/app/users.py:57`　標籤：`logic`
- 說明：密碼正確時回傳 True，其他路徑回傳 None，回傳型別不一致。參數 name 完全沒有使用，所以任何帳號名稱只要密碼等於管理員密碼就能登入。
- 建議：明確寫 `return False`，並同時驗證 name，例如 `return name == 'admin' and hmac.compare_digest(password, get_admin_password())`。

### 8. [🟠 High] 對 sqlite 資料列 join 會因非字串欄位而拋 TypeError
- 位置：`demo-app/app/users.py:66`　標籤：`logic`
- 說明：`SELECT *` 回傳的 row 內含整數 id，也可能含 None。`','.join(row)` 遇到非字串元素會拋 TypeError，匯出在第一筆資料就會失敗。欄位值含逗號或換行時，輸出的 CSV 也會損壞。
- 建議：改用 csv 模組：`csv.writer(f).writerow(row)`。若要自己 join，則寫成 `','.join(map(str, row))`。

### 9. [🟡 Medium] 資料庫路徑寫死為特定使用者的 Windows 路徑
- 位置：`demo-app/app/users.py:41`　標籤：`other`
- 說明：DB_PATH 指向 C:/Users/admin/prod.db,洩漏正式環境位置與帳號資訊,且無法在其他環境運作。
- 建議：改由環境變數或設定檔讀取:`DB_PATH = os.environ["DB_PATH"]`。

### 10. [🟡 Medium] 函式名 SearchUsers 未使用 snake_case，且缺 docstring
- 位置：`demo-app/app/users.py:44`　標籤：`naming`
- 說明：違反規範 1 與 5：函式應為 snake_case，公開函式需有繁體中文 docstring。
- 建議：改名為 search_users，並加上 docstring，例如 `"""依姓名關鍵字搜尋使用者。"""`。

### 11. [🟡 Medium] LIKE 搜尋把 keyword 直接串接，遇到單引號或 None 會出錯
- 位置：`demo-app/app/users.py:45`　標籤：`logic`
- 說明：keyword 含單引號時 SQL 語法錯誤並拋例外。keyword 為 None 時字串相加會拋 TypeError。keyword 內的 % 和 _ 也會被當成萬用字元，造成搜尋結果不符預期。
- 建議：使用參數化查詢：`conn.execute('SELECT id, name, email FROM users WHERE name LIKE ?', (f'%{keyword}%',)).fetchall()`。

### 12. [🟡 Medium] deleteUser、userId 未使用 snake_case，且缺 docstring
- 位置：`demo-app/app/users.py:49`　標籤：`naming`
- 說明：違反規範 1 與 5：函式與參數應為 snake_case，公開函式需有繁體中文 docstring。
- 建議：改為 `def delete_user(conn, user_id):` 並補上繁體中文 docstring。

### 13. [🔵 Low] deleteUser 無法得知是否真的刪除了資料
- 位置：`demo-app/app/users.py:51`　標籤：`logic`
- 說明：目標 id 不存在時 DELETE 影響 0 列，函式仍靜默結束，也沒有回傳值，呼叫端無法區分刪除成功與找不到。
- 建議：使用參數化查詢 `conn.execute('DELETE FROM users WHERE id = ?', (userId,))`，並回傳 `cur.rowcount > 0`。

---
_由 3 個平行 `claude -p` 審查 job 產生，經 aggregate.py 去重排序。_
