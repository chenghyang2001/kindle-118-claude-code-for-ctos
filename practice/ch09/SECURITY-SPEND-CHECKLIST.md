# 資安與支出控制檢查表（Security & Spend Controls Checklist）

依據 K118 第 9 章（第 19 章的 CISO 檢查表補充幾項）。書上沒有具體金額，所有數字都是**假設值**，請依團隊規模調整。
✅ = 本演練已在專案層完成；☐ = 需要正式環境或第三方帳號，只列出做法。

## A. 資安控制

| | 項目 | 做法 |
| --- | --- | --- |
| ✅ | 擋讀寫機密檔 | `permissions.deny`：`Read/Edit/Write` 對 `secrets/**`、`credentials/**`、`.env*`（`.claude/settings.local.json`） |
| ✅ | 擋破壞性指令 | deny `rm -rf`、`git push --force`、`git reset --hard`、`git clean -fdx`、`git branch -D` |
| ✅ | 放行測試與 lint | allow `npm test`、`npm run lint`、`uv run pytest`、`ruff check` 等 |
| ✅ | 實測規則有效 | `VERIFY.md`：9 項 claude -p 測試，含 bypassPermissions 模式與對照組 |
| ✅ | CLAUDE.md 資安規則 | 書上原文：`Never read or modify files in /secrets, /credentials, or any .env file.` |
| ☐ | 託管設定派發 | IT 用 MDM 派發 `managed-settings.json`（範本：`managed-settings.example.json`） |
| ☐ | 禁用 bypass 模式 | 託管設定 `permissions.disableBypassPermissionsMode: "disable"` |
| ☐ | 只允許託管 hook | `allowManagedHooksOnly: true` |
| ☐ | 指令換寫法的繞過 | 開 sandbox 或加 PreToolUse hook 檢查 `head`／`python -c` 讀機密檔 |
| ☐ | CI 憑證 | CI 用 Console API Key，不放個人 Pro/Max 憑證；金鑰每 **90 天**輪替（假設值） |
| ☐ | 日誌匯出 SIEM | OTel 匯出到公司後端，再轉 SIEM |
| ☐ | 合規文件歸檔 | SOC 2 Type II 報告、BAA（若涉 HIPAA）、ZDR 條款 |

## B. 支出控制

| | 項目 | 建議值 |
| --- | --- | --- |
| ☐ | 每人每日支出上限 | **US$20／人／日**（假設值） |
| ☐ | 警示閥值（Alert） | 達上限的 **50%／80%** 各發一次通知（假設值） |
| ☐ | 每個團隊一個 Console 工作區（Workspace） | 工作區設**硬性上限**，例：**US$2,000／月**（假設值） |
| ☐ | 每週支出儀表板 | 每週一檢視各工作區用量，超過預算 **20%** 要追原因（假設值） |
| ☐ | 預設模型 | 日常任務用較便宜的模型，複雜任務才切高階模型 |
| ☐ | 異常偵測 | 單人單日超過團隊平均 **3 倍**列入調查（假設值） |

> 以上 ☐ 項目需要 Anthropic Console 管理員帳號或 MDM，本演練只寫做法，沒有實際設定。
