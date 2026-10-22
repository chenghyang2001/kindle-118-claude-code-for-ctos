# CLAUDE.md 草案 — TaskFlow（虛構 Node.js SaaS）

> K118 第 1 章演練：把「CTO 腦中的架構規範」顯性化。TaskFlow 是虛構的多租戶專案管理 SaaS，所有細節皆為假設值。

## 專案概述

TaskFlow：B2B 多租戶任務管理 SaaS。技術堆疊（假設值）：Node.js 20、TypeScript strict、Express、PostgreSQL + Prisma、Redis、Jest。

## 架構規範（10 條）

1. **分層不可跨越**：`routes/` → `services/` → `repositories/`。route 不直接碰 Prisma；商業邏輯只放 `services/`。
2. **多租戶隔離**：每個資料庫查詢都必須帶 `tenantId` 條件，一律透過 `repositories/` 的 `scoped(tenantId)` 取得 client，禁止直接 `new PrismaClient()`。
3. **錯誤處理統一**：只拋 `src/lib/errors.ts` 定義的 `AppError` 子類（`NotFoundError`、`ValidationError`…），由全域 error middleware 轉成 HTTP 回應；回應中不得包含 stack trace 或 SQL。
4. **輸入驗證在邊界**：所有 request body / query 在 route 層用 Zod schema 驗證，schema 放 `src/schemas/`，前後端共用。
5. **資料庫變更只走 migration**：schema 修改必須用 `prisma migrate dev` 產生遷移檔，禁止手改正式資料庫，禁止修改已合併的 migration。
6. **機密不入程式碼**：API key、DB 連線字串一律讀環境變數，啟動時於 `src/config.ts` 檢查必要變數；新增變數要同步更新 `.env.example`。
7. **測試同步交付**：新增或修改 service 必須附 Jest 單元測試（正常、邊界、錯誤三種案例）；PR 前 `npm test` 與 `npm run lint` 必須全過。
8. **API 慣例**：RESTful 路徑、複數名詞（`/api/v1/projects`），正確使用 200/201/400/401/403/404/500；列表端點一律分頁（預設 20 筆）。
9. **相依套件要審**：新增 npm 套件前在 PR 說明用途與替代方案；禁止引入未維護（一年無發版）或授權不明的套件。
10. **禁止事項**：不改 `src/lib/auth/`（需 CTO 審核）、不在迴圈內逐筆查詢（用批次 `IN`）、不用 `any`、不 `console.log` 留在正式程式碼（用 `logger`）。

## 常用指令（假設值）

```bash
npm run dev       # 本機啟動
npm test          # Jest
npm run lint      # ESLint + tsc --noEmit
npx prisma migrate dev --name <描述>
```

---

## 本專案例外

本專案是 Kindle 書籍教學 demo（kindle-drill 快速模式），豁免全域「程式碼三 agent 鐵律」：主 Claude 直接寫檔，不派 code-writer／code-qa／code-reviewer；不需詢問複雜度，也不需詢問是否使用快速模式（已選快速模式）。
所有選擇題一律採用推薦選項、不要停下來問使用者；不可修改全域 `~/.claude/settings.json`，設定一律寫在本專案的 `.claude/settings.local.json`。
