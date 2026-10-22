# CLAUDE.md 範本：Node.js API

> 複製到專案根目錄改名為 `CLAUDE.md`，把 `＿＿＿` 換成實際值，刪掉不適用的條目。

## 專案概述

＿＿＿（一句話：這個 API 提供什麼服務、誰呼叫它）

## 技術堆疊

- Node.js ＿＿ + TypeScript（strict）
- 框架：Express ／ Fastify ／ NestJS
- 驗證：Zod（所有 request body / query）
- 資料庫：PostgreSQL ＋ ＿＿（Prisma ／ Drizzle ／ Knex）
- 測試：Jest ／ Vitest + supertest

## 常用指令

- 開發：`npm run dev`
- 測試：`npm test`
- Migration：`npm run migrate`
- Lint：`npm run lint`

## 目錄結構

- `src/routes/` 路由（只做參數驗證與呼叫 service）
- `src/services/` 商業邏輯
- `src/db/` 資料存取；`migrations/` migration 檔

## 規則

- SQL 一律參數化，禁止字串拼接。
- 錯誤回應用正確狀態碼（400/401/403/404/500），500 不回傳內部細節。
- 機密只從環境變數讀，新增變數要同步更新 `.env.example`。
- Schema 變更一律寫新的 migration（含 down），不改已合併的 migration；不要讓 AI 從頭設計 schema。
- 每個新端點要有整合測試：成功、驗證失敗、未授權各一。

## 完成定義

`npm test`、`npm run lint` 通過，新端點寫進 `docs/api.md`。
