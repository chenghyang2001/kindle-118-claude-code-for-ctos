
## 本專案例外

本專案是 Kindle 書籍教學 demo（kindle-drill 快速模式），豁免全域「程式碼三 agent 鐵律」：主 Claude 直接寫檔，不派 code-writer／code-qa／code-reviewer；不需詢問複雜度，也不需詢問是否使用快速模式（已選快速模式）。
所有選擇題一律採用推薦選項、不要停下來問使用者；不可修改全域 `~/.claude/settings.json`，設定一律寫在本專案的 `.claude/settings.local.json`。

## 專案概述

`legacy-shop-api`：小型 Express 4 API（CommonJS，Node 24），提供 users 與 orders 兩組端點。資料層是記憶體假資料，沒有真正的 DB。這是 K118 第 13 章「既有程式碼庫」的練習用舊專案，稽核結果見 `AUDIT_REPORT.md`。

## 架構

```
src/server.js            進入點（listen）
src/app.js               組裝 app（不 listen，給 supertest 用）
src/config.js            依 NODE_ENV 載入 config/environments/<env>.js
src/api/users/           users 路由＋service＋JSDoc 型別（2026-10-22 已遷移）
src/api/orders/          orders 路由＋service＋JSDoc 型別（遷移範本）
src/db/fakeDb.js         底層假資料（callback 介面，模擬舊 MySQL driver，不要改）
src/db/fakeDb.d.ts       fakeDb 的型別宣告，讓 tsc 不必檢查 fakeDb.js 本體
src/db/usersRepo.js      users repository（把 fakeDb 包成 Promise）
src/db/ordersRepo.js     orders repository（Promise 介面）
tests/                   Jest＋supertest
```

## 指令

| 用途 | 指令 |
| --- | --- |
| 啟動 | `npm start`（port 3000） |
| 測試 | `npm test` |
| 型別檢查 | `npm run typecheck`（tsc 5，`checkJs` strict，只檢查 tsconfig `include` 的檔案） |

## 慣例

- **Repository pattern**：所有資料存取都走 `src/db/` 的 repository，route／service 不直接碰資料陣列。
- **JSend 回應格式**：新端點一律回 `{status:'success',data}`／`{status:'fail',data}`／`{status:'error',message}`（orders 已採用）。
- **環境設定**放在 `config/environments/`，經 `src/config.js` 讀取，不可寫死在程式裡。
- 已遷移模組的寫法：`// @ts-check`＋JSDoc typedef（放在 `<module>.types.js`）＋`async/await`＋`asyncHandler` 包 route。

## Common Mistakes

1. **遷移時順手改回應格式**：users 目前回裸 JSON 和 `{error}`，表徵測試鎖的就是這個格式。改成 JSend 是另一張票，不能和 async 遷移混在同一個 commit。
2. **表徵測試寫在 service 層**：遷移會把 service 從 callback 改成 Promise，service 層測試一定會壞。表徵測試只打 HTTP（supertest）。
3. **以為 Express 4 會接 async 例外**：不會。async route 一定要用 `asyncHandler` 包起來，否則 rejected promise 變成 unhandled rejection、請求卡住。
4. **忘記 `fakeDb.reset()`**：資料層是模組層級的可變狀態，每個測試前都要 reset，否則測試順序會影響結果。
5. **把「既有 bug」當成要修的東西**：表徵測試會鎖住既有 bug（例如 `GET /api/users/abc` 回 404、回應帶 `password`），這些要另開票修並同步改測試。
6. **把新檔案加進 typecheck 卻沒改 `tsconfig.json` 的 `include`**：tsc 只檢查 include 清單內的檔案，沒加進去等於沒檢查。
7. **在 worktree 裡直接跑測試**：`git worktree add` 不會帶 `node_modules`，進 worktree 後先 `npm ci`。
8. **改不能動的舊 JS 檔來讓 typecheck 過**：tsc 會順著 `require` 檢查被引用的 JS。改用同名 `.d.ts`（例如 `src/db/fakeDb.d.ts`）提供型別，舊檔不動。
9. **以為 router 層的 `errorHandler` 能接住 body 解析錯誤**：`express.json()` 掛在 app 層，格式錯誤的 JSON 不會進 users／orders router 的 errorHandler，會落到 Express 預設處理器（回 HTML）。

## 遷移紀錄與流程（Phase 5 Maintain）

- 2026-10-22：users 從 callback 遷移到 async/await＋JSDoc（branch `migrate/users`，已 merge 並刪除 worktree）。22 個測試、typecheck 全過。
- 遷移任何模組的固定流程：
  1. 先跑 `npm test` 確認綠燈（起點必須是綠的）。
  2. 沒有表徵測試就先補，只打 HTTP；寫完故意改一行行為，確認測試會紅。
  3. `git worktree add ../<repo>-wt-<模組> -b migrate/<模組>` → `npm ci` → 照 orders 的寫法改。
  4. 新檔案加進 `tsconfig.json` 的 `include`，`npm test` 與 `npm run typecheck` 全過才 commit。
  5. 回主線 `git merge --no-ff`，再 `git worktree remove` 並刪分支。
  6. 把遇到的新坑補進上方 Common Mistakes。
- 待辦（見 `AUDIT_REPORT.md`）：`asyncHandler`／`errorHandler` 在 users 與 orders 各一份，下一步抽到 `src/lib/`（A4）；users 改 JSend（另開票，要同步改表徵測試）；安全問題 S1–S4 尚未處理。
