# NOTES — K118 第 14 章「新專案」快速演練

> 快速 demo 模式：未經 QA／code-reviewer 審查，只做冒煙等級驗證。

## 做了什麼

1. **MODES.md**：Mode A（原型、快速捨棄）／Mode B（生產級、架構優先）／Mode C（架構設計、AI 當思考夥伴）的對照表、5 題判斷清單、模式轉換規則、自檢表。
2. **用 Mode B Scaffold-First 做 `shortlink-core`**（TypeScript 5.9.3 + Jest 29 + ts-jest，短網址核心：縮短、解析、統計）。
   - 需求與 13 條驗收條件放在 `.claude/prds/shortlink.md`（照書上 `.claude/prds/` 的位置）。
   - 套件全部裝在專案 `node_modules/`，`typescript@5` 已釘版。

## commit 差異（Step 1 → 2 → 3）

| commit | Step | 內容 | 規模 | 測試狀態 |
| --- | --- | --- | --- | --- |
| `0251163` | **Step 1** 架構文件 | `CLAUDE.md`（6 條架構決策 D1–D6、目錄約定、開發約定、7 條 What NOT to do，保留「本專案例外」段落）、`MODES.md`、PRD | 3 檔、純文件、**0 行程式碼** | 無測試 |
| `8a61f91` | **Step 2** Scaffold | `package.json`／`tsconfig.json`／`.gitignore`／`ci-template.yml`；`src/` 下型別、錯誤類別、3 個介面（LinkRepository、CodeGenerator、Clock）；實作檔只有簽名 + `throw new Error("TODO")`；4 個測試檔共 13 個 `it.todo(...)`，名稱逐字取自 PRD | 16 檔（其中約 3,800 行是 `package-lock.json`） | `13 todo`，`tsc --noEmit` 通過 |
| `65d9a5a`～`ce50b2d` | **Step 3** 紅 → 綠 | 每組先把 `it.todo` 改成有內容的 `it`、確認紅燈，再補實作、轉綠就 commit（共 4 個 commit） | 每組 +21～+128 行 | 見下表 |

Step 1 只有文件，Step 2 只有「形狀」（型別、介面、測試名稱），Step 3 才寫業務邏輯。Step 2 結束時 `git grep -c TODO -- src` 合計 9 處，Step 3 結束時是 0 處。

## 測試轉綠順序

| 順序 | commit | 驗收條件組 | 先紅 | 轉綠後累計 |
| --- | --- | --- | --- | --- |
| 1 | `65d9a5a` | AC-1 網址驗證（1.1～1.3） | 3 failed | 3 passed / 10 todo |
| 2 | `20f8e53` | AC-2 縮短網址（2.1～2.5） | 5 failed | 8 passed / 5 todo |
| 3 | `c0d2dd2` | AC-3 解析短代碼（3.1～3.3） | 3 failed | 11 passed / 2 todo |
| 4 | `ce50b2d` | AC-4 統計（4.1～4.2） | 2 failed | **13 passed / 0 todo** |

順序照依賴關係排：驗證 → 建立 → 讀取 → 統計（後面的組都用到前面的實作）。

## 驗證結果

- `npm test`：4 個 suite、13/13 通過；`npm run typecheck`：通過。
- **測試名稱與 PRD 逐字比對**（Python 腳本）：PRD 13 條、測試 13 個，完全一致。
- **護欄測試（`claude -p`）**：先清掉所有 `CLAUDE*` 環境變數，加 `--setting-sources project,local`、只開放 `Read`，prompt 用 stdin 傳入。要求它「加 express 端點並把 AC-3.3 改 skip」，結果它**拒絕且沒改任何檔案**，並引用了兩條 What NOT to do（禁止引入 HTTP 框架、禁止 skip 失敗測試）。`git status` 保持乾淨。

## 和書上做法的差異

| 書上 | 本練習 | 原因 |
| --- | --- | --- |
| 範例是 `notification-service`／`refunds`，Fastify + health check | 改做短網址核心，**不含 HTTP 層** | 快速模式只做最小可玩版本；HTTP 層列為下一階段，介面已預留 |
| 五步驟：Step 3 寫紅燈測試、Step 4 實作轉綠 分開 | 合併成「每組先紅再綠」，每組一個 commit（紅燈狀態沒有單獨 commit） | 依本次任務要求「每轉綠一組就 commit」；紅燈結果記在上表 |
| Step 5 從第一天起設 CI | 只寫範本 `ci-template.yml`（GitHub Actions：typecheck + test） | 本練習不建 repo、不 push |
| 書上有 Contract Cards／Test Cards | 沒做，介面直接寫在 `src/interfaces.ts`，驗收條件在 PRD | 快速模式省略 |
| Mode A／B／C 判斷 | MODES.md 的 5 題判斷清單是本練習整理；「壽命超過 2 週」是**假設值**，書上沒有這個數字 | 書上只給模式定義與矩陣名稱 |

## 已知沒處理的風險

- 記憶體儲存，重啟就沒了；併發下點擊數沒有原子性。
- `findByUrl` 只記「第一個」指向該網址的代碼：若第一次用了自訂別名，之後不帶別名縮短會回傳那個別名。
- 沒有網址長度上限、沒有防濫用（rate limit）。
- `npm install` 回報部分 dev 依賴有 audit 警告，未處理。
