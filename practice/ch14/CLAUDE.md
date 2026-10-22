# CLAUDE.md — shortlink-core 架構文件

> 本專案示範 K118 第 14 章 Mode B（Scaffold-First）。這份文件是**架構文件**，在寫任何程式碼之前完成。
> 需求與驗收條件見 `.claude/prds/shortlink.md`。

## 專案概述

`shortlink-core`：短網址服務的核心邏輯函式庫（縮短、解析、統計）。
本階段只做核心領域層，HTTP 層（Fastify 等）留到下一階段，介面已預留。

## 架構決策（ADR 摘要）

| # | 決策 | 理由 |
| --- | --- | --- |
| D1 | TypeScript 5（strict）+ Jest + ts-jest | 與書上範例一致；TS 7 與 ts-jest 不相容，釘 `typescript@5` |
| D2 | 分三層：`validation/`（純函式）→ `services/`（業務規則）→ `repositories/`（儲存） | 業務規則可單測，不綁儲存方式 |
| D3 | 儲存透過 `LinkRepository` 介面注入，先實作 `InMemoryLinkRepository` | 之後換 Redis／Postgres 不必改 service |
| D4 | 亂數代碼與時間透過 `CodeGenerator`、`Clock` 介面注入 | 測試可決定性，不 mock 全域 |
| D5 | 錯誤用自訂 Error 類別（`InvalidUrlError` 等），不回傳 `null` | 呼叫端用 `instanceof` 分流，HTTP 層好對應 4xx |
| D6 | 代碼為 6 碼 base62；自訂別名 3～20 碼 `[A-Za-z0-9-]` | 6 碼 base62 ≈ 568 億組（62^6），demo 足夠 |

## 目錄約定

```
src/
  types.ts                      # 領域型別（ShortLink、LinkStats）
  errors.ts                     # 自訂錯誤類別
  interfaces.ts                 # LinkRepository、CodeGenerator、Clock
  validation/url.ts             # URL／別名驗證（純函式）
  services/shortener-service.ts # 業務規則
  repositories/in-memory-link-repository.ts
  index.ts                      # 對外匯出
tests/                          # 一個驗收條件 = 一個 it()，名稱逐字複製 PRD
```

## 開發約定

- 測試名稱**逐字**複製 PRD 的驗收條件編號與文字（例：`AC-2.1 ...`）。
- 一次只讓一組驗收條件（AC-x）轉綠，轉綠就 commit。
- 指令：`npm test`（Jest）、`npm run typecheck`（`tsc --noEmit`）。
- 註解與 commit message 用繁體中文。

## What NOT to do

- ❌ **不要**在 Scaffold 階段（Step 2）寫任何業務實作或測試內容；實作檔只能 `throw new Error("TODO")`。
- ❌ **不要**修改測試名稱來「讓測試過」；名稱是驗收條件，改名要先改 PRD。
- ❌ **不要**刪除或 `skip` 失敗的測試；紅燈就修實作。
- ❌ **不要**在 service 裡直接用 `Math.random()`、`Date.now()`；一律透過注入的 `CodeGenerator`／`Clock`。
- ❌ **不要**引入 HTTP 框架、資料庫驅動或其他執行期依賴（本階段零 runtime 依賴）。
- ❌ **不要**用 `any`；型別不確定就定義介面。
- ❌ **不要**升級到 TypeScript 7（ts-jest 不相容）。

## 本專案例外

本專案是 Kindle 書籍教學 demo（kindle-drill 快速模式），豁免全域「程式碼三 agent 鐵律」：主 Claude 直接寫檔，不派 code-writer／code-qa／code-reviewer；不需詢問複雜度，也不需詢問是否使用快速模式（已選快速模式）。
所有選擇題一律採用推薦選項、不要停下來問使用者；不可修改全域 `~/.claude/settings.json`，設定一律寫在本專案的 `.claude/settings.local.json`。
