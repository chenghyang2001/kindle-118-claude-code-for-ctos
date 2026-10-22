# VERIFY：GET /api/health 是否遵守 CLAUDE.md

## 測試方式

- 指令：`claude -p --setting-sources project,local --permission-mode acceptEdits`（執行前先清掉所有 `CLAUDE*` 環境變數）
- Prompt 只寫：「新增一個 GET /api/health 端點，回報服務狀態。」**沒有重述任何慣例**，
  用來看 Claude 是否會從根目錄 `CLAUDE.md` 與 `src/api/CLAUDE.md` 自己取得規則。
- 子 session 產出：`src/services/healthService.js`、`src/api/health.js`、`tests/health.test.js`，修改 `src/app.js`。
- 驗證結果：`npm test` 2 suites / 7 tests 全過；`npm run lint` 0 錯誤；子 session 沒有執行 git。

## 逐條對照表

| # | 規則（出處） | 結果 | 證據 |
| --- | --- | :---: | --- |
| 1 | `src/api` 只處理 HTTP，邏輯放 `src/services`（根 Conventions） | ✅ | 新增 `healthService.getHealth()`，router 只呼叫它 |
| 2 | 成功回 `{ data: ... }`（根 Conventions） | ✅ | `res.json({ data: healthService.getHealth() })` |
| 3 | 失敗回 `{ error }`，交統一錯誤處理（根 Conventions） | ✅ | catch 內 `return next(err)`；404 測試驗證 `{ error: 'Not found' }` |
| 4 | 一個資源一個檔 `src/api/<resource>.js`，匯出 Router（api 層） | ✅ | `src/api/health.js` 匯出 `express.Router()` |
| 5 | 以 `/api/` 開頭掛載，且在 404／錯誤處理之前（api 層） | ✅ | `app.js` 第 10 行 `app.use('/api/health', healthRouter)`，位於 users 之後、404 之前 |
| 6 | 所有分支用 `return` 結束（api 層） | ✅ | `return res.json(...)` / `return next(err)` |
| 7 | 呼叫 service 的 handler 用 try/catch（api 層） | ✅ | 有 try/catch |
| 8 | 每個新端點至少成功＋錯誤各 1 個測試（根 Conventions、api 層） | ✅ | 成功：GET 200；錯誤：POST 404 |
| 9 | 測試放 `tests/*.test.js`、用 `createApp()`、不開真 server（根、api 層） | ✅ | `tests/health.test.js` 用 `request(createApp())` |
| 10 | 測試名稱繁中、格式 `'METHOD /path 描述'`（根 Conventions） | ✅ | `'GET /api/health 回 200 與 status ok'` |
| 11 | service 提供 `reset()` 供測試還原（根 Conventions） | ➖ | 未提供；子 session 說明「無可變狀態所以不需要」，屬合理例外 |
| 12 | 風格：2 空格、單引號、分號、trailing comma（根 Conventions） | ✅ | 物件最後一個屬性有 trailing comma，lint 通過 |
| 13 | 註解繁中、寫「為什麼」（根 Conventions） | ✅ | `healthService.js` 註解說明為何放 service 層 |
| 14 | 改完跑 `npm test && npm run lint`（根 Commands） | ✅ | 子 session 回報兩者都跑過且通過 |
| 15 | 不改 ESM／不加 TypeScript（根 Do-not） | ✅ | 維持 CommonJS |
| 16 | 不新增相依、不全域安裝（根 Do-not） | ✅ | `package.json` 未變動 |
| 17 | 不把 `listen()` 移進 `app.js`（根 Do-not） | ✅ | `app.js` 仍只 export `createApp` |
| 18 | 不洩漏內部錯誤（根 Do-not） | ✅ | 沿用統一錯誤處理 |
| 19 | 不刪/跳過既有測試（根 Do-not） | ✅ | users 5 個測試仍在且通過 |

**結論：18 條遵守、1 條合理例外（#11），0 條違反。**

## 觀察

- 子 session 一開始試用 Bash heredoc 寫檔被權限擋下，自動改用 Write/Edit；不影響結果。
- 慣例裡的「service 要有 `reset()`」寫得太絕對，下次可改成「有可變狀態的 service 要提供 `reset()`」。
