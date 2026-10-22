# src/api/CLAUDE.md — API 層專屬規則

Claude 讀到這個目錄的檔案時才會載入本檔；通用規則見根目錄 `CLAUDE.md`。

## 檔案與掛載

- 一個資源一個檔案：`src/api/<resource>.js`，匯出 `express.Router()`。
- 在 `src/app.js` 以 `app.use('/api/<resource>', router)` 掛載，路徑一律以 `/api/` 開頭。
- 掛載順序：所有 router 必須在 404 handler 與統一錯誤處理之前。

## Handler 寫法

- 每個 handler 的所有分支都用 `return` 結束（`return res.json(...)` / `return next(err)`）。
- 會呼叫 service 的 handler 用 `try/catch` 包住，catch 內 `return next(err)`。
- path / query 參數格式檢查可以在路由層直接回 `400 { error }`；
  其他商業規則錯誤一律由 service 拋出帶 `status` 的 Error。
- 不在 handler 內寫資料存取或驗證邏輯；需要新邏輯就加到 `src/services/`。

## HTTP 語意

| 情境 | Status | Body |
| --- | --- | --- |
| 讀取成功 | 200 | `{ data }` |
| 建立成功 | 201 | `{ data }` |
| 參數格式錯誤 / 驗證失敗 | 400 | `{ error }` |
| 資源不存在 | 404 | `{ error }` |
| 未預期錯誤 | 500 | `{ error: 'Internal server error' }` |

## 測試

- 每個新端點在 `tests/<resource>.test.js` 加 supertest 測試：至少成功 1 個＋錯誤 1 個。
- 測試用 `createApp()`，不要啟動真的 server。
