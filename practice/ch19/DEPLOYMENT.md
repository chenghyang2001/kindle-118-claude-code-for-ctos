# DEPLOYMENT.md — Claude Code 部署路徑選擇指南

> K118《Claude Code for CTOs》第 19 章「部署 Claude Code」演練產出。
> 書上列出四大部署路徑（[10]）；本文件中**書上沒有給的數字一律標「假設值」**，導入前請以 `https://claude.com/pricing` 與合約為準。

## 1. 四種部署路徑比較表

| 面向 | A. CLI＋Pro/Max 訂閱 | B. CLI＋API Key | C. Claude Agent SDK | D. Managed Agents |
| --- | --- | --- | --- | --- |
| 一句話 | 個人用 OAuth 登入的 Claude Code | Claude Code 改用 Console 發的 API Key | 用 SDK 自己寫 Agent／內部工具 | Anthropic 託管執行環境的 Agent |
| 適用規模 | 個人～小團隊（假設值：1–10 人） | 中大型團隊、CI/CD、需要集中帳務 | 有平台工程能力、要客製流程的團隊 | 不想自管基礎設施、要快速上線的團隊 |
| 計費方式 | 每人固定月費（訂閱額度） | 依 Token 用量計費（Console 帳務） | 依 Token 用量計費（API） | 依用量計費＋託管執行成本（以官方定價為準） |
| 成本可預測性 | 高（固定費） | 中（需設上限） | 中（需設上限） | 中 |
| 管控能力 | 弱：綁個人帳號，組織難以集中稽核 | 強：Console 組織／專案工作區（API Workspaces）、硬性支出上限（Hard Spend Cap） | 最強：權限、工具、流程全部由程式碼決定 | 中強：以託管平台的設定與政策控管 |
| 資安考量 | **禁止**放在 CI Runner、共享機器、Bastion Host（書上明確要求，[11][12]） | 金鑰外洩風險 → 需輪替 SOP、Secret Manager、最小權限 | 自行負責沙盒、工具權限、輸入驗證、日誌 | 資料落在託管環境 → 需確認資料留存（ZDR）與地域合規 |
| 稽核／日誌 | 個人層級，難匯出 | 可依工作區看用量；日誌匯出 SIEM | 自建日誌，最彈性 | 依平台提供的日誌 |
| 資料駐留需求 | 不適合 | 可改走 AWS Bedrock／Google Vertex AI（[11][13]） | 同左 | 依託管服務地域 |
| 典型用途 | 工程師日常開發 | 團隊開發＋CI 自動審查 | 內部 Slack bot、自動化 pipeline | 長時間背景任務、免維運 Agent |

### 各路徑設定步驟（本演練只寫範本，不實際登入或建立帳號）

**A. CLI＋Pro/Max**

1. 個人安裝 Claude Code，以訂閱帳號 OAuth 登入（本演練**不執行** `/login`）。
2. 專案根目錄放 `.claude/settings.json`（參考 `templates/settings.project.example.json`）限制工具權限。
3. 規定：個人憑證只能留在個人機器。

**B. CLI＋API Key**

1. 管理員在 Anthropic Console 建立組織與專案工作區（每個團隊一個工作區）。
2. 為每個工作區設定硬性支出上限（金額為假設值，例：每團隊每月 USD 500）。
3. 在工作區內發 API Key，存入 Secret Manager／CI Secret，**不寫進檔案**。
4. CI 以環境變數注入（變數名見 `env.example`），依 `KEY-ROTATION-RUNBOOK.md` 定期輪替。

**C. Agent SDK**

1. 用專屬工作區的 API Key（或短效憑證）。
2. 在程式中明確列出允許的工具（allowlist），預設拒絕。
3. 加上日誌、速率限制、錯誤處理，送 SIEM。

**D. Managed Agents**

1. 先完成 CISO 審查（見 `CISO-SPEND-CHECKLIST.md`），特別是 ZDR 與資料駐留。
2. 在託管平台建立 Agent，綁定專屬工作區與支出上限。
3. 定義人工確認點（高風險動作需人核准）。

## 2. 依團隊情境的選擇建議

| 團隊情境 | 建議路徑 | 理由 |
| --- | --- | --- |
| 新創 / 小團隊，主要是工程師本機開發 | **A** | 固定費、零設定；但 CI 不可用個人憑證 |
| 要在 CI 自動跑 Claude（PR 審查、稽核） | **B** | 書上明確規定 CI 必須用 Console API Key 或短效 SDK 憑證 |
| 中大型組織、需要分部門計費與上限 | **B**（開發）＋ A（個人試用） | 工作區＋硬性上限才能控支出 |
| 要做內部工具（Slack bot、自動化 pipeline） | **C** | 流程與權限可完全程式化 |
| 有資料駐留／法規要求（金融、醫療） | **B 或 C 走 Bedrock / Vertex AI** | 地域與合約可控 |
| 沒有平台工程人力、要長時間背景 Agent | **D** | 免維運，但須先過 ZDR 審查 |

**推薦預設組合**：工程師本機用 A；所有自動化（CI、排程、bot）一律 B 或 C，並各自有獨立工作區與硬性上限。

## 3. 共通紅線

- 個人 Pro/Max 憑證不得出現在 CI、共享機器、Bastion Host。
- 任何金鑰不得 commit；`env.example` 只放變數名與假值。
- 每個工作區都要設硬性支出上限，並每週檢查支出儀表板。
- 權限設定放在專案層 `.claude/settings.json`，進版控、走 code review。
