# K118 快速演練課表

依據：NotebookLM 筆記本 `c68a1d30…`（書 PDF）回答的「各章讀者實際動手操作」，原文在 `teaching/ask/`（2026-10-22 查詢）。
本書是寫給 CTO 的：第 1～10 章偏管理與策略（沒有或很少指令），改成產出可直接用的文件（診斷表、評估矩陣、財務模型、導入計畫、檢查表）；第 11～22 章是 Harness、CLAUDE.md、既有程式碼、平行化、多儲存庫、MCP 等實作，真的動手。附錄的範本併入第 22 章收尾。

每段提示詞前面都要加：「全自動執行：不要問我任何問題、不要用選擇題，所有選擇一律採用你的推薦，直接做完並回報」。

## 共通限制（每章都適用）

- **絕不執行** `/logout`、`/login`、`/upgrade`、`/install-github-app`、`/statusline`、`/doctor`，不修改全域 `~/.claude/` 底下任何檔案；書上寫全域、託管設定（managed settings）或 Console 的，一律改成專案層設定或只寫範本。
- `claude mcp add`、`claude plugin install` 一律 `--scope project`。
- 不設 `ANTHROPIC_API_KEY`；需要第三方帳號（Anthropic Console、OTel 後端、Sentry、Slack、GitHub token）的一律只寫範本。
- 不建 GitHub repo、不 push、不部署；Python 套件裝在專案 `.venv`（用 uv），Node 套件裝在專案內。
- 練習中要用 `claude -p` 時先清 `CLAUDE*` 環境變數。
- 數字與案例以書上為準；書上沒有的數字要標「假設值」。
- 每章產出 `NOTES.md`：做了什麼、驗證結果、和書上做法的差異。完成後 git add＋commit。

## 各章提示詞

| 章 | 主題 | 要練習視窗做的事 |
| --- | --- | --- |
| 01 | CTO 的現實 | 寫 `DIAGNOSIS.md`：書上四種 CTO 原型（Solo／Small Team／Mid-Size／Scaling）各自的核心瓶頸、AI 導入第一步；附一份可勾選的「團隊瓶頸診斷表」。再寫 `CLAUDE.md` 草案，把「CTO 腦中的架構規範」顯性化成 10 條以內的規則（以一個虛構的 Node.js SaaS 為例） |
| 02 | 代理式轉變 | 寫 `AGENTIC-LOOP.md`：Observe→Plan→Act→Verify 四階段各一個 Claude Code 實例。建一個最小 TypeScript 付款模組（含 `src/lib/errors.ts` 與 Jest 測試），照書上提示詞把它重構成 strategy pattern、公開 API 不變、每個大改動後跑測試；最後產出「代理式轉變準備檢查表」，把 8 個虛構 backlog 任務分成 Agent 輔助型／人類主導型 |
| 03 | 市場全景 | 寫 `TOOL-MATRIX.md`：Vibecoding 類（如 Lovable、Bolt）與 Agentic Coding 類（如 Claude Code、Cursor agent）的評估矩陣，評估軸用書上的企業控制、成本可預測性、多檔案推理能力等；再寫 `HANDOFF-POLICY.md`：原型工具做出的東西交接到生產環境的規範 |
| 04 | 商業論證 | 用 Python（openpyxl，裝在專案 .venv）產生 `business-case.xlsx`：開發者全額成本、高／中影響任務加權、20% 基準效率（保守 15%、樂觀 30%）、2–4 小時培訓、前兩週生產力下降 10–15%、每人每月訂閱成本，算出三種情境的 ROI 與回本月數；同時寫 `BUSINESS-CASE.md` 給老闆看的一頁摘要（數字從試算表讀出，不要手抄） |
| 05 | 工作方法論 | 建最小 Express＋TypeScript 專案（`src/middleware/auth.ts`、`src/services/user.ts`）。照書上：寫標準 `PRD.md`（五大區塊：問題與成功指標、角色與權限的使用者故事、可測試驗收條件、流程與邊界、技術備註）→ 用 plan 模式產出 RBAC（admin／editor／viewer）方案寫進 `PLAN.md` 後切回 bypass → 實作並寫測試 → 用書上的「PR 代理預審」提示詞自我審查，結果寫進 `PRE-REVIEW.md` |
| 06 | 團隊導入 | 寫 `ROLLOUT.md`：書上「四週漸進式導入路徑」每週的目標、活動、完成標準；`SANDBOX-PROJECTS.md` 列 3 個有真實價值的沙盒專案候選與挑選理由；`FAQ.md` 與 `ANTI-PATTERNS.md` 各 8 條以上 |
| 07 | 衡量成效 | 寫 `METRICS.md`：子代理對 session 比率（健康值 >2.0）、開發者對代理比率（目標 >2.5）的定義、計算方式與廢除條件（指標生命週期檢查表）。用 Python 寫 `metrics.py`：讀一份自己產生的假 session 事件 JSONL，算出這兩個比率並輸出表格，附 pytest。另寫專案層 `.claude/settings.local.json` 的 hook 遙測範本（把 session 事件 POST 到內部 API，URL 用 localhost 範本，不真的送） |
| 08 | 氛圍編碼應用的問題 | 先做一個故意很「vibe」的小 Flask 原型（寫死密鑰、沒有測試、N+1 查詢、沒有 migration）。照書上六大面向提示詞做生產就緒度稽核，產出 `AUDIT.md`（markdown 表格、critical／high／medium／low）與 `PROMOTION_CHECKLIST.md`（原型晉升生產的檢查表），再實際修掉所有 critical 項並補上最少的測試 |
| 09 | 資安合規與治理 | 在專案 `.claude/settings.local.json` 寫 permissions：deny 讀寫 `/secrets`、`/credentials`、`.env*`，deny 破壞性指令（`rm -rf`、`git push --force` 等），allow 測試與 lint；在 `CLAUDE.md` 加書上的資安規則。放一個假的 `.env` 與 `secrets/` 檔，用 `claude -p` 嘗試讀取，驗證被擋下並記錄。另寫 `CISO-SUMMARY.md` 一頁摘要（資料流向、留存、合規）與「資安與支出控制檢查表」 |
| 10 | 擴大採用 | 寫 `SCALING.md`：依團隊規模選 Guild／Hub-and-Spoke／Embedded Champions 的決策表。建立共享提示詞庫結構 `prompt-library/`（SQL migration、測試生成各 2 個提示詞，附使用說明），`.claude/templates/` 放 React 前端、Node API、Python 資料管道三種 `CLAUDE.md` 範本；寫每週 30 分鐘分享會的議程範本 |
| 11 | Harness 框架 | 照書上四週計畫在一個小專案實際搭 Harness：Week1 專案 `CLAUDE.md`；Week2 `.claude/settings.local.json` 的 deny／allow；Week3 `PreToolUse`（擋寫入 `migrations/` 以外的 SQL 檔）與 `PostToolUse`（寫檔後跑格式化或記 log）hook；Week4 `.claude/agents/` 建一個只能 Read／Grep 的審查 subagent。用 `claude -p` 觸發，驗證 hook 有擋、有記錄，subagent 不能寫檔 |
| 12 | CLAUDE.md | 在一個 Node API 專案執行等同 `/init` 的流程（用 `claude -p` 請它分析並產生 `CLAUDE.md`），再照書上三層結構整理：專案根目錄（Project overview、Tech stack、Commands、Conventions、Do-not，50–80 行內）＋`src/api/CLAUDE.md`；User 層 `~/.claude/CLAUDE.md` 只寫範本到 `templates/`。最後用 `claude -p` 請它新增一個端點，檢查是否遵守 |
| 13 | 既有程式碼庫 | 建一個小型「舊專案」：Express callback 風格的 `src/api/users/`、已改成 async/await 的 `src/api/orders/`、幾個 TODO／FIXME、一段死碼。照書上五階段：Audit（架構勘測＋技術債清單 → `AUDIT_REPORT.md`）→ Onboard（產生 `CLAUDE.md` 並補 Common Mistakes）→ Stabilize（為 users 寫表徵測試鎖住現有行為）→ Modernize（用 `git worktree add` 開 `migrate/users` 分支，照 orders 的模式改成 async/await＋型別，測試全過後合併）→ Maintain（把學到的寫回 CLAUDE.md） |
| 14 | 新專案 | 寫 `MODES.md` 說明 Mode A／B／C 的判斷。用 Mode B 的 Scaffold-First 做一個小服務：Step1 先寫 `CLAUDE.md` 當架構文件（決策、約定、What NOT to do）→ Step2 只產生目錄、介面、型別與「驗收條件當測試名稱」的空測試骨架（不准寫業務實作）並 commit → Step3 逐一實作讓測試轉綠 |
| 15 | 大規模脈絡管理 | 寫 `CONTEXT-PLAYBOOK.md`：一任務一 session、顯性前置載入、三個檔案以上強制 plan 模式、何時 `/compact`、何時 `/clear`。實際示範：在一個中型假專案（自動產生 30 個以上檔案）裡，先用「前置載入」提示詞指定要改的檔案、型別與測試完成一個修改，再對照「不指定」的做法，記錄兩者讀了幾個檔案、花多少回合 |
| 16 | 平行化 | 實作書上的平行化模式中的三種：Mode 2 subagents（一次 `claude -p` 派 2 個子代理分別寫測試與文件）、Mode 3 git worktrees（兩個 worktree 各做一個 feature，最後合併）、唯讀提問 session 搭配開發 session（只示範規則，不同時改檔）。寫 `PARALLEL.md` 比較各模式的適用情境與衝突風險 |
| 17 | 多儲存庫設定 | 在練習資料夾建平坦同級佈局：`work/backend`、`work/frontend`、`work/shared-contracts` 各自 git init，`work/.claude/` 作為控制區（生態系 `CLAUDE.md`、`modules/billing.md`、部署順序規則），父目錄本身不是 repo。寫 `ONBOARDING.md`：新人如何 clone 與啟動 spanning session |
| 18 | 多儲存庫開發 | 延續第 17 章的佈局（在本章資料夾重建即可）。照書上 Cascade：先在 `shared-contracts` 加 invoice 的 `billingPeriod` 欄位（OpenAPI 或 TS 型別）→ 用書上提示詞產生跨 repo 交接文件 `.claude/handoffs/billing-period.md`（前後 JSON、型別、各消費端要改的檔案）→ 後端以向下相容方式實作 → 前端依交接文件更新。各 repo 分別 commit |
| 19 | 部署 Claude Code | 寫 `DEPLOYMENT.md`：四種部署路徑（CLI＋Pro/Max、CLI＋API Key、Agent SDK、Managed Agents）的比較表與選擇建議；`KEY-ROTATION-RUNBOOK.md`（API 金鑰輪替 SOP）；專案層權限設定範本；「CISO 審查與支出控制檢查表」。CI 用的金鑰只寫環境變數範本，不填真值 |
| 20 | 自動化與內部工具 | 寫 `.github/workflows/claude-review.yml` 範本：PR 時以 headless 模式跑三個平行審查（正確性、資安、規範）。本機實際跑一次：用 `claude -p` 對一份含問題的 diff 做三種審查並彙整成 `REVIEW-REPORT.md`。不 push、不真的接 GitHub |
| 21 | 代理式產品設計 | 寫 `AGENTIC-SPEC-CHECKLIST.md`（代理式產品需求審查檢查表，涵蓋透明度與理由、來源追溯、人機協同中斷點與復原）與 `HITL-MATRIX.md`（依風險等級決定要不要人工確認的矩陣）；用一個虛構的「自動退款客服代理」實際套一次並找出 3 個缺口 |
| 22 | MCP 優先的未來（含附錄範本） | 用 Python 或 TypeScript 寫一個 100–300 行的內部工具 MCP server（例：查詢假部署紀錄的 tool＋列出服務狀態的 resource，操作冪等並寫 audit log），以 `--scope project` 掛上，用 `claude -p` 實際呼叫一次。最後把附錄的導入檢查表與前端／後端 `CLAUDE.md` 範本整理進 `templates/`，並寫 `RETRO.md` 回顧全書 22 章演練 |
