# CLAUDE.md

## Project overview

`k118-ch12-users-api`：K118 第 12 章 CLAUDE.md 演練用的小型 Express REST API，
提供 users 的列表、查詢、建立。資料存在記憶體（重啟即重置），沒有資料庫。

```
src/server.js            進入點：createApp().listen(PORT)
src/app.js               createApp() factory：middleware、路由、404、統一錯誤處理
src/api/                 路由層（Express Router）— 另有 src/api/CLAUDE.md 專屬規則
src/services/            商業邏輯層：驗證、資料存取、自訂錯誤類別
tests/                   supertest 對 createApp() 做 HTTP 整合測試
```

## Tech stack

- Node.js 24，**CommonJS**（`require` / `module.exports`），ECMAScript 2022
- Express 4
- Jest 29 + supertest 7
- ESLint 9（flat config `eslint.config.js`，`@eslint/js` recommended）

## Commands

```bash
npm install                     # 安裝相依（裝在專案 node_modules）
npm start                       # 啟動 server，預設 port 3000（PORT 可覆寫）
npm test                        # 全部 Jest 測試
npx jest -t "建立成功"           # 依名稱跑單一測試
npm run lint                    # ESLint 檢查 src 與 tests
```

沒有 build 步驟。改完程式一律跑 `npm test && npm run lint` 再回報完成。

## Conventions

- 分層：`src/api` 只處理 HTTP；資料與驗證邏輯一律放 `src/services`。
- 回應格式：成功 `{ data: ... }`，失敗 `{ error: '<訊息>' }`；建立資源回 `201`。
- 錯誤：service 拋出帶 `status` 的自訂 Error（`ValidationError` 400、`NotFoundError` 404），
  由 `app.js` 統一錯誤處理回應；5xx 一律回 `Internal server error`。
- service 以具名函式物件匯出，並提供 `reset()` 讓測試還原初始資料。
- 測試：放 `tests/`、檔名 `*.test.js`、`beforeEach` 呼叫 `reset()`；測試名稱用繁中，
  格式如 `'POST /api/users 缺 email 回 400'`。每個新端點至少一個成功案例＋一個錯誤案例。
- 風格：2 空格、單引號、分號、trailing comma、`(x) => ...`、預設值用 `??`。
- 註解用繁體中文，寫「為什麼」不寫「做什麼」。

## Do-not

- 不要在路由層直接存取或修改資料（必須經過 `src/services`）。
- 不要在錯誤回應中洩漏 stack trace 或內部訊息。
- 不要改成 ESM（`import`/`export`）或引入 TypeScript。
- 不要新增相依套件，除非任務明確要求；不要全域安裝（`npm i -g`）。
- 不要把 `app.listen()` 移進 `app.js`（會讓 supertest 測試必須開 port）。
- 不要修改 `~/.claude/` 底下任何全域設定；專案設定寫在 `.claude/settings.local.json`。
- 不要跳過或刪除既有測試來讓 `npm test` 通過。

## 本專案例外

本專案是 Kindle 書籍教學 demo（kindle-drill 快速模式），豁免全域「程式碼三 agent 鐵律」：主 Claude 直接寫檔，不派 code-writer／code-qa／code-reviewer；不需詢問複雜度，也不需詢問是否使用快速模式（已選快速模式）。
所有選擇題一律採用推薦選項、不要停下來問使用者；不可修改全域 `~/.claude/settings.json`，設定一律寫在本專案的 `.claude/settings.local.json`。
