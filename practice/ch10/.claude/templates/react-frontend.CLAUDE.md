# CLAUDE.md 範本：React 前端

> 複製到專案根目錄改名為 `CLAUDE.md`，把 `＿＿＿` 換成實際值，刪掉不適用的條目。

## 專案概述

＿＿＿（一句話：這個前端給誰用、做什麼）

## 技術堆疊

- React ＿＿ + TypeScript（strict）
- 建置：Vite ／ Next.js ＿＿
- 樣式：Tailwind CSS ／ CSS Modules
- 狀態：React Query（伺服器資料）、Zustand ／ useState（UI 狀態）
- 測試：Vitest ／ Jest + Testing Library；E2E：Playwright

## 常用指令

- 開發：`npm run dev`
- 測試：`npm test`
- 型別檢查：`npx tsc --noEmit`
- Lint：`npm run lint`

## 目錄結構

- `src/components/` 共用元件（一個元件一個資料夾，含測試）
- `src/features/` 依功能分的頁面與邏輯
- `src/api/` API 呼叫（唯一可以呼叫 fetch 的地方）

## 規則

- 元件用函式元件 + hooks，props 一律有型別，禁止 `any`。
- 使用者輸入不可用 `dangerouslySetInnerHTML` 輸出。
- 新元件要有 Testing Library 測試（以使用者行為測，不測實作細節）。
- 新頁面需在手機（< 640px）與桌面都可用；互動元素要有 `aria-label`。
- 不要新增 npm 套件，除非先說明原因並等我確認。

## 完成定義

`npm test`、`npx tsc --noEmit`、`npm run lint` 全部通過。
