# CLAUDE.md — 後端（API Service）範本

> 依 K118 附錄後端範本的重點整理：Express／Fastify RESTful 路由結構、Prisma migration、Zod schema 驗證、AppError 統一捕捉。其餘數字與指令是假設值。

## 專案概述

<一句話：這個 API 服務負責什麼、誰會呼叫它>

## 技術棧

- Node.js ＋ TypeScript strict
- 框架：Express 或 Fastify（擇一，寫在這裡）
- ORM：Prisma（PostgreSQL）
- 驗證：Zod
- 測試：Jest／Vitest ＋ Supertest

## 常用指令

```bash
npm run dev
npm test
npx prisma migrate dev --name <說明>   # 只在本機
npx prisma generate
```

## 目錄結構

- `src/routes/<資源>.ts`：路由，只做參數解析與呼叫 service
- `src/services/`：商業邏輯
- `src/schemas/`：Zod schema（request／response）
- `src/errors/AppError.ts`：統一錯誤類別
- `prisma/schema.prisma`、`prisma/migrations/`

## 慣例

- RESTful：`GET /resources`、`GET /resources/:id`、`POST`、`PATCH`、`DELETE`
- 每個 request body／query 先過 Zod `parse`，失敗回 400
- 商業錯誤丟 `AppError(statusCode, code, message)`，由全域 error middleware 統一轉成 JSON；不在路由內各自 `res.status(500)`
- 500 錯誤不回傳堆疊或 SQL 細節
- schema 變更一律產生 Prisma migration 檔並 commit；migration 要向下相容（先加欄位、後移除，第 18 章 Cascade）

## 禁止事項

- 不直接改已套用的 migration 檔
- 不在程式碼寫連線字串或金鑰，用環境變數
- 不執行 `prisma migrate reset`、不連正式資料庫

## 完成前檢查

- [ ] `npm test` 全過，新端點有成功與 400／404 測試
- [ ] 有 schema 變更就有對應 migration
