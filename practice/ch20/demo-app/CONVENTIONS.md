# demo-app 程式碼規範（規範審查 job 依此判斷）

1. 函式與變數一律 snake_case；類別 PascalCase；常數全大寫。
2. SQL 一律參數化查詢（`?` placeholder），禁止字串拼接。
3. 機密（密碼、token）只能從環境變數讀取，不可寫死。
4. 不可使用裸 `except:`；例外必須具體並記錄 log 或往上拋。
5. 公開函式需有繁體中文 docstring。
6. 開啟的連線 / 檔案必須關閉（with 或 try/finally）。
