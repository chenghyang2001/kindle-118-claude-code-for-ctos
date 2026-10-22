# PRD：shortlink-core（短網址核心）

## 目標

把長網址轉成短代碼、用短代碼找回原網址，並記錄點擊次數。

## 驗收條件（Acceptance Criteria）

> 測試名稱必須逐字使用下列文字。

### AC-1 網址驗證

- AC-1.1 拒絕非 http/https 的網址並拋出 InvalidUrlError
- AC-1.2 拒絕空字串並拋出 InvalidUrlError
- AC-1.3 接受 http 與 https 網址

### AC-2 縮短網址

- AC-2.1 預設產生 6 碼 base62 代碼
- AC-2.2 同一網址縮短兩次回傳同一代碼
- AC-2.3 接受 3 到 20 碼的自訂別名
- AC-2.4 自訂別名已被使用時拋出 AliasTakenError
- AC-2.5 自訂別名格式不符時拋出 InvalidAliasError

### AC-3 解析短代碼

- AC-3.1 用代碼取回原始網址
- AC-3.2 每次解析點擊數加一
- AC-3.3 未知代碼拋出 NotFoundError

### AC-4 統計

- AC-4.1 回傳點擊數與建立時間
- AC-4.2 查詢統計不會增加點擊數

## 非目標

- HTTP API、持久化資料庫、到期時間、使用者帳號（下一階段）。
