# MCP Server 準備度與安全性檢查表（第 22 章）

> 書上列的五大項：強型別 Schema、可觀測性日誌、冪等性、速率限制、破壞性操作要人工批准。括號內是本演練 `deploy_mcp.py` 的對照。

## 設計

- [ ] 選高價值、低風險的第一個內部工具（部署管道／監控／工單／staging DB）（✅ 假部署紀錄）
- [ ] Protocol-first：先列 Tools、Resources、Prompts 再寫碼（✅ 2 tools＋1 resource，無 prompt）
- [ ] 唯讀和寫入分成不同 tool，方便分別授權（✅ list / confirm 分開）

## 介面

- [ ] 每個參數有型別與範圍檢查（✅ service 非空、limit 1–50）
- [ ] 錯誤訊息給呼叫端看得懂，不洩漏內部細節（✅ DeployError）

## 安全

- [ ] 寫入操作冪等（✅ 重複確認不覆蓋）
- [ ] 速率限制（✅ 30 次／60 秒，假設值）
- [ ] 破壞性操作需人工批准（⬜ 本例沒有破壞性操作；若有，tool 只產生「待批准請求」）
- [ ] 憑證走環境變數，不寫進 `.mcp.json`（✅ 不需憑證）
- [ ] 用 `--allowedTools` 只放行需要的工具（✅ 驗證時逐一放行）

## 可觀測性

- [ ] 每次 tool 呼叫寫 audit（時間、工具、參數、結果）（✅ logs/audit.jsonl）
- [ ] 失敗與被限流也要記（✅ outcome=error）

## 部署

- [ ] 以專案層 `.mcp.json` 共享，不寫進個人全域設定（✅）
- [ ] 有單元測試與一次端到端呼叫紀錄（✅ VERIFY.md）
