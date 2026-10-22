# CLAUDE.md — 前端（React / Next.js）範本

> 依 K118 附錄前端範本的重點整理：UI 元件測試、MSW mock API、共享元件 80% 覆蓋率。其餘數字與指令是假設值，請換成自己專案的。

## 專案概述

<一句話：這是什麼產品的前端、給誰用>

## 技術棧

- Next.js（App Router）＋ TypeScript strict
- 樣式：Tailwind CSS
- 測試：Vitest／Jest ＋ React Testing Library ＋ MSW（Mock Service Worker）
- E2E：Playwright（假設值）

## 常用指令

```bash
npm run dev        # 本機開發
npm test           # 單元／元件測試
npm run lint       # ESLint
npm run typecheck  # tsc --noEmit
```

## 目錄結構

- `src/components/shared/`：共享元件（覆蓋率要求最高）
- `src/features/<功能>/`：功能模組，元件＋hooks＋測試放一起
- `src/mocks/`：MSW handlers，所有 API mock 集中於此

## 慣例

- 元件測試用 React Testing Library，以使用者看得到的文字／role 查元素，不測實作細節
- 呼叫 API 的元件一律用 MSW 攔截，不在測試裡 mock fetch
- `src/components/shared/` 覆蓋率 ≥ 80%（書上數字）
- 新元件要有 props 型別，不用 `any`
- 無障礙：互動元件要有 `aria-label` 或可見標籤

## 禁止事項

- 不在元件內直接呼叫 `fetch`，透過 `src/lib/api/` 的封裝
- 不提交 `.env*`，不在前端放任何密鑰
- 不修改 `src/mocks/` 以外的測試基礎設施，除非任務明確要求

## 完成前檢查

- [ ] `npm test`、`npm run lint`、`npm run typecheck` 全過
- [ ] 新增的共享元件有測試
