<!-- Phase 1 Audit：由 claude -p 子 session（--setting-sources project,local、唯讀工具 Read/Grep/Glob）執行書上兩段 prompt（架構勘測＋技術債盤點）產生，2026-10-22。表中「預估工時」與嚴重度為子 session 估計，書上沒有對應數字，一律視為假設值。 -->

# AUDIT_REPORT

> 專案：`legacy-shop-api` v0.3.0（Express 4.22.3，CommonJS）
> 範圍：`src/`、`config/`、`package.json`、`tsconfig.json`、`.gitignore`（不含 `node_modules`）
> 方法：只做靜態分析，逐檔讀過全部 11 個原始碼檔。`tsc`、`jest`、`npm audit` 這類執行指令在本次環境需要核准，因此**都沒有實際執行**。下面標「推論」的結論，是讀程式碼得出、尚未跑程式確認的。

---

## 1. 架構地圖

### 1.1 模組與分層

```
src/server.js  ──(進入點：app.listen)──┐
                                       ├─► src/config.js ─► config/environments/${NODE_ENV}.js
src/app.js  (Express 組裝，不 listen)  │
  ├─ express.json()                    │
  ├─ /api/users  ─► users.routes.js ───┘(也直接讀 config)
  │                   └─► users.service.js ─► db/fakeDb.js     （callback 風格、未遷移）
  └─ /api/orders ─► orders.routes.js
                      └─► orders.service.js ─► db/ordersRepo.js （async/await + JSDoc、已遷移）
                          orders.types.js（只放 JSDoc typedef，執行時是空物件）
```

| 層 | 檔案 | 風格 | 職責 |
|---|---|---|---|
| 進入點 | `src/server.js` | — | 讀 config、監聽 port |
| App 組裝 | `src/app.js` | — | 掛 JSON parser 與兩組 router，匯出 app 方便測試 |
| 設定 | `src/config.js`、`config/environments/development.js` | — | 依 `NODE_ENV` 動態 `require` 設定檔 |
| Users 路由／服務 | `src/api/users/*` | `var` + callback | CRUD（只有 list/get/create）、已失效的 CSV 匯出 |
| Orders 路由／服務 | `src/api/orders/*` | `// @ts-check` + async + JSend | list/get/create，有 router 層級的錯誤處理 |
| 資料層 | `src/db/fakeDb.js`、`src/db/ordersRepo.js` | callback／Promise | 記憶體陣列模擬 DB，有 `reset()` 與種子資料 |

### 1.2 模組間溝通
- 全部是**同步的 `require` 呼叫鏈**：routes → service → repo。沒有事件匯流排，也沒有 DI。
- 進入點：`npm start` 執行 `src/server.js`；測試入口預定是 `src/app.js`（supertest 用），但目前沒有任何測試檔。

### 1.3 資料庫層
- **沒有真正的 DB**。`fakeDb.js` 用 `setImmediate` 模擬非同步的 MySQL driver callback 介面；`ordersRepo.js` 是 `async` 函式包住記憶體陣列。
- 狀態是模組層級的全域可變變數（`users`、`orders`、`nextId`、`failNext`），程序重啟就消失。
- 舊的 MySQL 設定已註解掉，見 `config/environments/development.js:4-9`。

### 1.4 外部 API／訊息佇列／非同步處理
- **外部 API 整合：沒有。**
- **訊息佇列：沒有。**
- 非同步只有兩種：`fakeDb` 的 `setImmediate` callback，以及 orders 的 Promise。沒有背景工作、排程或 worker。

---

## 2. 架構疑慮

| # | 疑慮 | 位置 | 嚴重度 |
|---|---|---|---|
| A1 | **同一個 app 有兩套典範**：users 用 callback／`var`／裸 JSON，orders 用 async／`@ts-check`／JSend。API 消費端要處理兩種回應格式（`{error}` 與 `{status,data}`） | `src/api/users/*` 對比 `src/api/orders/*` | 🔴 高 |
| A2 | **沒有全域錯誤處理器，也沒有 404 處理器**。orders 的 `errorHandler` 只掛在 router 層級（`orders.routes.js:60-64`）。users 和 app 層的錯誤，例如 `express.json()` 解析失敗，都交給 Express 預設處理器；非 production 下它會在 HTML 回應裡輸出 stack trace（推論） | `src/app.js:4-9` | 🔴 高 |
| A3 | **型別檢查涵蓋不全**：`tsconfig.json:14` 只 include orders 與 `ordersRepo`，users、fakeDb、config、app、server 完全沒有型別防護 | `tsconfig.json:14` | 🟠 中 |
| A4 | **缺少共用抽象**：`asyncHandler`、錯誤處理器、JSend 回應 helper、id 解析、驗證邏輯都寫在 orders 模組內，users 無法重用 | `orders.routes.js:13-15, 60-63` | 🟠 中 |
| A5 | **跨層依賴**：路由層直接讀 config 來決定要不要註冊路由（feature flag 寫在 routes 裡） | `users.routes.js:4, 37` | 🟡 低 |
| A6 | **資料層可變性外洩**：`ordersRepo.findById` 直接回傳內部物件參考；`findAll` 只做淺拷貝，`items` 陣列仍共用；`insert` 直接存呼叫端傳進來的 `items` 參考。呼叫端改了就會污染「DB」 | `ordersRepo.js:22, 30, 38-39` | 🟠 中 |
| A7 | **測試鉤子混在正式程式碼**：`__failNextQuery`、`reset` 和正式 API 一起匯出，`failNext` 是全域狀態 | `fakeDb.js:9, 18-20, 57` | 🟡 低 |
| A8 | **設定載入很脆弱**：`config.js` 依 `NODE_ENV` 動態 `require`，但只有 `development.js`。設 `NODE_ENV=production` 啟動時會直接 `MODULE_NOT_FOUND` 崩潰（推論）。port 寫死成 3000，不讀 `process.env.PORT` | `src/config.js:4-5`、`development.js:3` | 🟠 中 |
| A9 | 沒有 graceful shutdown、結構化 log、健康檢查端點 | `src/server.js` | 🟡 低 |
| A10 | 跨模組沒有參照完整性：建立訂單時不檢查 `userId` 是否存在 | `orders.service.js:33-43` | 🟡 低 |

- **循環依賴：沒有發現。** 依賴圖是單向樹狀。`orders.types.js` 只被 JSDoc `import()` 引用，執行時沒有循環。
- **God class：沒有。** 專案很小，每個檔案都不超過 66 行。

---

## 3. 技術債清單（依優先序）

工時是對「修好 + 補對應測試」的粗估。

| 優先 | 項目 | 檔案:行號 | 類型 | 嚴重度 | 預估工時 |
|---|---|---|---|---|---|
| P1 | `FIXME(2024-03-15)`：密碼雜湊回傳給前端。而且不只 list，`getUser`、`createUser` 的回應也帶 `password`（見 S1） | `users.service.js:7-8, 15, 30` | FIXME／安全 | 🔴 嚴重 | 1–2 h |
| P2 | 建立使用者時直接存明文 `data.password`，沒有雜湊 | `users.service.js:27` | 安全 | 🔴 嚴重 | 2–3 h |
| P3 | 沒有全域錯誤／404 處理器；預設處理器會洩漏 stack | `src/app.js` | 架構 | 🔴 高 | 1 h |
| P4 | users 模組仍是 callback + `var` 寫法（舊式慣用法），而且回應格式和 orders 不一致；需要比照 orders 遷移成 async + JSend + `@ts-check` | `users.routes.js:1-45`、`users.service.js:1-49`、`fakeDb.js` | 過時寫法／重複 | 🔴 高 | 4–6 h |
| P5 | 訂單金額由客戶端決定：`price` 直接取自 request body，`qty`／`price` 也沒驗證型別、正負與整數，可以造出負數或 `NaN` 的 total（見 S3） | `orders.service.js:34-42` | 驗證缺口 | 🔴 高 | 2–3 h |
| P6 | `FIXME(2024-02-08)`：非數字 id 回 404 而不是 400。另外 `parseInt("12abc")` 會被當成 12 接受 | `users.routes.js:16-17` | FIXME／Bug | 🟠 中 | 0.5 h |
| P7 | `TODO(2024-01-20)`：email 重複沒有檢查，email 格式也沒驗證 | `users.service.js:20, 25` | TODO | 🟠 中 | 1–2 h |
| P8 | 只有 `development.js` 一個設定檔，production 會啟動失敗；port 寫死 | `src/config.js:2-5`、`development.js:3` | 設定 | 🟠 中 | 1 h |
| P9 | `HACK(2023-11-02)`：test 環境共用 development 設定 | `src/config.js:3-4` | HACK | 🟠 中 | 0.5 h |
| P10 | `ordersRepo` 回傳內部參考、淺拷貝 | `ordersRepo.js:22, 30, 38` | Bug 風險 | 🟠 中 | 0.5–1 h |
| P11 | `tsconfig` 型別檢查範圍只涵蓋 orders | `tsconfig.json:14` | 設定 | 🟠 中 | 隨 P4 一起做，另 +1 h |
| P12 | **死碼**：`legacyExportCsv` 與 `/export.csv` 路由（flag 永遠是 `false`）。該路由還忽略 `err`，一旦觸發會在 `setImmediate` 內拋 TypeError，讓整個程序崩潰；CSV 欄位也沒跳脫（推論） | `users.routes.js:36-43`、`users.service.js:35-42, 48`、`development.js:10` | 死碼 | 🟡 低 | 0.5 h |
| P13 | **設定檔有註解掉的區段**：舊 MySQL 設定，註解自己寫著 2023 年就沒用了 | `config/environments/development.js:4-9` | 註解區段 | 🟡 低 | 0.1 h |
| P14 | **重複邏輯**：`reset`／種子資料／`nextId` 的模式在兩個資料層各寫一次；users 路由裡 `500 Internal error` 重複 3 次；兩個模組的 id 解析和驗證各寫一套 | `fakeDb.js:7-15` 對比 `ordersRepo.js:12-18`；`users.routes.js:10, 19, 30`；`users.routes.js:17` 對比 `orders.routes.js:28-29` | 重複 | 🟡 低 | 1–2 h |
| P15 | Express 4 已進入維護期；換成 Express 5 後內建 async rejection 處理，就不需要手寫 `asyncHandler` | `package.json:13`、`orders.routes.js:8-15` | 依賴版本 | 🟡 低 | 2–4 h |
| P16 | 程式碼風格不一致（單／雙引號混用、`var` 與 `const` 混用），也沒有 ESLint／Prettier 設定 | 全專案 | 工具鏈 | 🟡 低 | 1 h |
| P17 | `npm test` 跑的是 `jest`，但沒有任何測試檔，Jest 預設會以「No tests found」非零結束（推論） | `package.json:9` | 工具鏈 | 🟠 中 | 見第 5 節 |

**帶日期的 TODO／FIXME／HACK 總覽**（依時間排序）：

| 標記 | 日期 | 位置 | 至今未處理（截至 2026-10-22） |
|---|---|---|---|
| HACK | 2023-11-02 | `src/config.js:3` | 約 3 年 |
| TODO | 2024-01-20 | `src/api/users/users.service.js:25` | 約 2 年 9 個月 |
| FIXME | 2024-02-08 | `src/api/users/users.routes.js:16` | 約 2 年 8 個月 |
| FIXME | 2024-03-15 | `src/api/users/users.service.js:7` | 約 2 年 7 個月 |

---

## 4. 安全發現

| # | 發現 | 位置 | 嚴重度 |
|---|---|---|---|
| S1 | **敏感資料外洩**：`GET /api/users`、`GET /api/users/:id`、`POST /api/users` 的回應都帶 `password` 欄位 | `users.service.js:8, 15, 30`、`users.routes.js:11, 21, 32` | 🔴 嚴重 |
| S2 | **明文存密碼**：`createUser` 不做雜湊，原樣存入 | `users.service.js:27` | 🔴 嚴重 |
| S3 | **竄改價格**：訂單單價和數量完全由客戶端提供。可以送負數 `price`／`qty` 造出負金額，或送字串讓 JS 隱式轉型 | `orders.service.js:42` | 🔴 高 |
| S4 | **完全沒有身分驗證與授權**：任何人都能列出所有使用者和所有訂單、替任意 `userId` 下單（IDOR） | `src/app.js:6-7` | 🔴 高 |
| S5 | **Stack trace 洩漏**：`NODE_ENV` 預設是 development，送格式錯誤的 JSON 時，Express 預設錯誤處理器會回傳 stack（推論） | `src/app.js:5`、`src/config.js:2` | 🟠 中 |
| S6 | 缺少基本防護：沒有 `helmet`、rate limit、明確的 body 大小限制（目前用預設 100kb）、CORS 政策 | `src/app.js` | 🟠 中 |
| S7 | 輸入驗證不足：users 的 `name`／`email` 只檢查 truthy，可以傳物件或陣列進來；email 格式不驗證 | `users.service.js:20` | 🟡 低 |
| S8 | 死碼 CSV 匯出若被重新啟用，有 CSV／公式注入風險（欄位沒跳脫），而且錯誤時會讓程序崩潰 | `users.service.js:36-42`、`users.routes.js:39-40` | 🟡 低（目前不可達） |
| S9 | 依賴弱點掃描（`npm audit`）**這次沒能執行**，狀態未知 | `package-lock.json` | — |

`.gitignore` 已排除 `.env`，repo 裡也沒有發現寫死的憑證，這部分沒有問題。

---

## 5. 測試覆蓋現況

| 項目 | 現況 |
|---|---|
| 測試檔數量 | **0**（排除 `node_modules` 後，找不到 `*.test.js`、`*.spec.js` 或 `__tests__/`） |
| 測試框架 | 已裝 `jest@^29.7.0` 和 `supertest@^7.3.1`，但沒用到 |
| 可測性準備 | 有，而且不錯：`app.js` 和 `listen` 分開；兩個資料層都有 `reset()`；`fakeDb.__failNextQuery()` 可以模擬 DB 失敗 |
| 覆蓋率 | **0%**（`coverage/` 已列入 `.gitignore`，但沒有覆蓋率設定） |
| 靜態型別 | 只有 orders 模組和 `ordersRepo` 在 `checkJs: strict` 範圍內，約佔原始碼的 40% |
| CI | 沒有（沒有 `.github/workflows`） |

**建議優先補的測試**（依風險排序）：
1. users 回應不得含 `password`，用來鎖住 S1 的回歸。
2. `POST /api/orders` 遇到負數、字串、缺欄位的 items 要回 400（S3）。
3. users 的 DB 失敗路徑要回 500：用 `__failNextQuery` 模擬。
4. `GET /api/users/abc` 要回 400（P6），`GET /api/orders/abc` 要回 400。
5. 格式錯誤的 JSON body 要回 JSON 錯誤，不能回 HTML stack（S5）。
6. 在 users 遷移成 async（P4）**之前**先寫 characterization tests，作為重構的安全網。

---

### 總結建議路線

1. **立即處理**：S1、S2、S3、P3，約 1 人天。
2. **短期**：先補 characterization tests，再把 users 遷移成 orders 的範本，並擴大 `tsconfig` 的 include（P4、P11），約 1.5 人天。
3. **清理**：處理死碼、註解掉的設定、HACK 與重複邏輯（P9、P12–P14），約 0.5 人天。
