# CISO 審查與支出控制檢查表

> 書上第 19 章列出的檢查重點：每週工作區支出儀表板、日誌匯出至 SIEM、ZDR 零資料留存協議簽署等（[11]）。其餘項目為延伸；**數字皆為假設值**。

## A. 帳號與憑證

- [ ] 已在 Anthropic Console 建立組織，並依團隊／專案切分工作區（API Workspaces）。
- [ ] CI Runner、共享機器、Bastion Host 上**沒有**個人 Pro/Max 憑證（書上明確要求）。
- [ ] CI 自動化只用 Console API Key 或短效 SDK 憑證。
- [ ] 所有 API Key 存在 Secret Manager／CI Secret，版本庫內只有 `env.example`。
- [ ] 已有金鑰輪替 SOP（`KEY-ROTATION-RUNBOOK.md`），並排定下次輪替日。
- [ ] 離職流程包含撤銷該員可存取的金鑰。

## B. 資料保護與合規

- [ ] 已評估並（如需要）簽署 ZDR 零資料留存協議。
- [ ] 確認資料駐留需求；有地域要求者改走 AWS Bedrock／Google Vertex AI。
- [ ] 已定義哪些資料不可送進 Claude（個資、客戶機密、憑證檔）。
- [ ] 專案層 `.claude/settings.json` 已 deny 讀取 `.env`、`secrets/`、金鑰檔。

## C. 權限與執行環境

- [ ] 專案層權限設定進版控並經 code review（範本：`templates/settings.project.example.json`）。
- [ ] 危險指令（`rm -rf`、`git push --force`、`curl | sh`）列入 deny。
- [ ] `--dangerously-skip-permissions` 只允許在拋棄式沙盒 CI Runner 使用。
- [ ] MCP server／plugin 一律以 `--scope project` 安裝並經審查。

## D. 稽核與監控

- [ ] 使用日誌匯出至 SIEM。
- [ ] 設定異常告警：單日用量超過平均 3 倍（假設值）即通知。
- [ ] 每季（假設值）複查權限設定與工作區成員。

## E. 支出控制

- [ ] 每個工作區都設定硬性支出上限（Hard Spend Cap），例：每團隊每月 USD 500（假設值）。
- [ ] 每週檢視工作區支出儀表板，由負責人簽核。
- [ ] 用量達上限 80%（假設值）時自動通知團隊負責人。
- [ ] 個人訂閱（Pro/Max）席次與 API 用量分開記帳。
- [ ] 每月對帳：實際支出 vs. 預算，差異超過 20%（假設值）需說明。

## 簽核

| 角色 | 姓名 | 日期 | 結論（通過／有條件通過／不通過） |
| --- | --- | --- | --- |
| CISO |  |  |  |
| 財務 |  |  |  |
| 工程負責人 |  |  |  |
