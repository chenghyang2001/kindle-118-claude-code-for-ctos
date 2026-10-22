# NOTES：K118《Claude Code for CTOs》第 5 章「工作方法論」快速演練

> 快速 demo 模式：主 Claude 直接寫檔，未走 writer／QA／reviewer 三 agent 流程。

## 做了什麼

照書上「PRD → plan → 實作＋測試 → PR 代理預審」四段流程：

1. **PRD.md**：標準五大區塊——問題與成功指標、角色與權限的使用者故事（含權限矩陣）、可測試驗收條件 AC1–AC11、流程與邊界、技術備註。
2. **PLAN.md**：RBAC（admin／editor／viewer）方案。關鍵決策是路由只認「權限字串」（`users:read`、`users:change-role`…），角色→權限對照集中在 `src/types.ts`，改 role 屬於欄位級權限。
3. **實作**（Express 4＋TypeScript 5.9.3）

   | 檔案 | 內容 |
   | --- | --- |
   | `src/middleware/auth.ts` | `authenticate`（Bearer token→`req.user`，否則 401）、`authorize(permission)`（否則 403）、`hasPermission` |
   | `src/services/user.ts` | `UserService`：記憶體資料、輸入驗證、email 唯一、先驗證後寫入、刪人撤銷 token、保留最後一位 admin |
   | `src/app.ts` | 路由＋集中錯誤中介層（不洩漏堆疊） |
   | `src/types.ts`、`src/errors.ts`、`src/server.ts` | 型別與權限表、`HttpError`、啟動入口（token 讀環境變數 `DEMO_ADMIN_TOKEN`） |
   | `tests/*.test.ts` | Jest＋ts-jest＋supertest，三組測試 |

4. **PRE-REVIEW.md**：用 `claude -p` 跑 PR 代理預審兩輪。第一輪 high 2 個（admin 可自我降級導致沒有管理員＋缺測試）→ 修掉，順手修 4 個小 medium → 第二輪 high 0。

## 驗證結果

| 項目 | 結果 |
| --- | --- |
| `npm test` | 3 個 suites、**42 個測試全過** |
| `npx tsc --noEmit` | 無錯誤 |
| 預審第一輪 | critical 0／high 2／medium 5／low 12 |
| 預審第二輪（修正後） | critical 0／**high 0**／medium 4／low 11 |
| 測試對應 PRD | AC1–AC11 每條都有 supertest 測試 |

中途有一個測試失敗（body 超過 10kb 預期 413、實際 500）。查證是**實作的問題**：錯誤中介層那段修改因 PostToolUse 格式化 hook 改了排版而沒套上。測試本身正確，補上後轉綠。

## 和書上做法的差異

| 書上 | 本次 | 原因 |
| --- | --- | --- |
| 按 shift+tab 進 plan 模式，產出方案後由人核准，再切回 bypass permissions | 沒有實際切換模式，以「只讀、不改程式」的方式直接產出 PLAN.md 後接著實作 | 使用者要求全自動、不問問題；`EnterPlanMode`／`ExitPlanMode` 需要人按核准，會卡住流程 |
| PR 預審在 PR 上跑（通常是 GitHub 上的 PR／CI） | 本機用 `claude -p` headless 對工作目錄唯讀審查 | 限制不 push、不建 repo；也未安裝 GitHub App |
| 預審由獨立 reviewer 跑 | 同上，`claude -p` 是獨立子 session，但只給 Read／Grep／Glob | 保持唯讀、避免子 session 自己改檔或 commit |
| — | `claude -p` 前清 `CLAUDE*` 環境變數並加 `--setting-sources project,local` | 排除全域 Stop hook，避免子 session 自行 commit |
| 書上未指定 TS 版本 | 釘 `typescript@5`（實裝 5.9.3） | TS 7 與 ts-jest 不相容 |
| 認證 | 靜態 token 對照表（demo） | PRD 非目標含登入流程；正式應換 JWT／OIDC |
| 權限設定 | 只寫在專案 `.claude/settings.local.json` | 不修改全域 `~/.claude/` |

PRD 中的成功指標數字（100% 擋下、每條 AC 至少 1 個測試）書上沒有，已標「假設值」。

## 已知未處理的風險（快速模式，未經三 agent QA）

- 預審第二輪的 4 個 medium、11 個 low 未修（見 PRE-REVIEW.md）：其他 body-parser 錯誤仍回 500、email／name 無長度上限、500 路徑沒測試等。
- 資料存在記憶體，重啟即消失；token 明文存在記憶體。
- 沒有速率限制。
