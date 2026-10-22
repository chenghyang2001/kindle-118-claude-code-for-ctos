# K118 第 13 章「既有程式碼庫」快速演練筆記

日期：2026-10-22｜模式：快速 demo 模式（未經 QA／reviewer）

## 做了什麼

| 階段 | 產出 | commit |
| --- | --- | --- |
| 0 基準 | 小型 Express 4 舊專案 `legacy-shop-api`：callback 風格 `src/api/users/`（routes＋service，經 callback 假資料層 `src/db/fakeDb.js`）、已遷移的 `src/api/orders/`（async/await＋JSDoc＋JSend）、4 個帶日期的 TODO／FIXME／HACK、死碼（`legacyExportCsv`＋永遠關閉的 `/export.csv`）、註解掉的 MySQL 設定 | `627e94f` |
| 1 Audit | 用 `claude -p`（唯讀工具）跑書上兩段 prompt（架構勘測、技術債盤點）→ `AUDIT_REPORT.md`：架構疑慮 10 項、技術債 17 項、安全發現 9 項、測試覆蓋 0% | `17a82e5` |
| 2 Onboard | 根目錄 `CLAUDE.md`（保留「本專案例外」段落，加入書上三條慣例：repository pattern／JSend／`config/environments/`，加上 Common Mistakes 6 條）；模組級 `src/api/users/CLAUDE.md` | `17a82e5` |
| 3 Stabilize | `tests/users.characterization.test.js` 19 個表徵測試（含既有 bug、DB 錯誤路徑、驗證順序、死碼路由）＋ orders 3 個測試；CI 閘門範本 `.github/workflows/ci.yml` | `e3c51cf` |
| 4 Modernize | `git worktree add ../k118-ch13-wt-users -b migrate/users` → 在 worktree 內用 `claude -p` 跑書上的 Strangler Fig 遷移 prompt → users 改成 async/await＋`// @ts-check`＋JSDoc 型別，新增 `usersRepo.js`、`users.types.js`、`fakeDb.d.ts` → commit → 主線 `merge --no-ff` → `worktree remove`＋刪分支 | `310076b`、`0a764c5` |
| 5 Maintain | `CLAUDE.md` 架構圖更新、Common Mistakes 增為 9 條、加上遷移紀錄與固定流程、待辦 | 本次 commit |

## 驗證結果

- `npm test`：遷移前 22/22、遷移後（worktree 內與 merge 後）22/22 全過。
- `npm run typecheck`（tsc 5.9.3，strict＋checkJs）：遷移後涵蓋 users，0 錯誤。
- 突變檢查：把 `parseInt` 改成 `Number`，表徵測試 1 個轉紅 → 確認測試真的鎖得住行為，之後還原。
- 覆蓋率（遷移前）：users routes 88%、service 79%，未覆蓋的行全是死碼。
- Common Mistake 第 9 條實測：送壞 JSON 到 `POST /api/users` 回 `400 text/html`，並印出 stack。
- Onboard 實測：乾淨的 `claude -p` 只讀 CLAUDE.md，就能答出「遷移不可順便改 JSend」「進 worktree 先 `npm ci`」。
- 收尾檢查：`git worktree list` 只剩主線，`migrate/users` 分支已刪，兄弟目錄 `k118-ch13-wt-users` 已移除。

## 與書上做法的差異

1. **Onboard 沒有執行 `claude /init`**：CLAUDE.md 已經有必須保留的「本專案例外」段落，所以改由主 session 直接撰寫，內容涵蓋 `/init` 會產生的部分（概述、架構、指令），再照書上 prompt 補上慣例與 Common Mistakes。
2. **「TypeScript types」改用 JSDoc＋`// @ts-check`**：專案是 CommonJS JS，orders 範本也用 JSDoc，所以沒有轉成 `.ts`、沒有裝 ts-jest，typecheck 用 `tsc --noEmit`（typescript@5）。
3. **worktree 路徑**：書上是 `../migration-users`，本練習照指示用 `../k118-ch13-wt-users`，分支名同樣是 `migrate/users`。
4. **規模**：書上的案例是 15 年 Java 單體、5 年 Django、React Native app；本練習只是約 300 行的玩具專案，只跑一個遷移分支，沒有真的平行跑多個 worktree。
5. **CI 品質閘門只寫範本**：沒有 push、沒有建 GitHub repo，所以 workflow 不會執行。
6. **書上的第 5 段 prompt（前後比較總結）沒有另外產生簡報級文件**，重點已收在本檔與 CLAUDE.md 的遷移紀錄。
7. **數字**：`AUDIT_REPORT.md` 的嚴重度與「預估工時」由子 session 估計，書上沒有對應數字，標為**假設值**。測試數、覆蓋率是本機實測值。
8. **遷移時子 session 有自行判斷的地方**：死碼路由順手轉成 async（否則有型別錯誤）；`asyncHandler` 在 users 另寫一份泛型版（共用化留到 A4）；為了不改 `fakeDb.js`，新增 `fakeDb.d.ts`。

## 已知沒處理的風險

- 安全問題 S1–S4（回應帶 password、明文存密碼、訂單價格由客戶端決定、沒有認證）都只記錄，沒修。這些行為被表徵測試刻意鎖住。
- users 還不是 JSend，API 回應格式仍有兩套。
- 沒有全域錯誤處理器，壞 JSON 會回 HTML 並帶 stack。

## 執行環境注意

- `claude -p` 前先清掉 `CLAUDE*` 環境變數，並一律加上 `--setting-sources project,local`。
- 同時用 `--allowedTools` 時，prompt 改從 stdin 傳入。
- 全域的 formatter hook 在主 session 寫檔後會把引號改成雙引號；子 session 排除全域設定，不受影響。
