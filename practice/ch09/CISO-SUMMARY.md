# CISO 一頁式資安摘要：Claude Code 導入

> 對象：資安長（CISO）、法遵、IT。依據 K118 第 9 章；書上沒有的數字標「假設值」。標「待確認」的項目要用簽約時拿到的正式文件核對。

## 1. 資料流向

```
開發者電腦（Claude Code CLI）
   │  只傳送「這次任務需要的程式碼脈絡」：使用者提示詞、模型讀到的檔案片段、工具輸出
   ▼
Anthropic API（或 AWS Bedrock / Google Vertex AI，若有資料駐留需求）
   │  回傳模型輸出（文字、工具呼叫）
   ▼
開發者電腦：工具在本機執行（讀檔、跑指令），結果再送回 API
```

- **不會**整個 repo 上傳或建索引；只有模型實際讀取的內容會離開電腦。
- 所以要管的是「模型能讀什麼」：用 `permissions.deny` 擋 `secrets/`、`credentials/`、`.env*`（本專案已實測擋住，見 `VERIFY.md`）。
- 遙測（OpenTelemetry）可導向公司自己的後端，見 `managed-settings.example.json` 的 `env` 範本。

## 2. 資料留存

| 方案 | 留存 | 來源 |
| --- | --- | --- |
| 商業方案（API／Team／Enterprise）預設 | **30 天**（安全與濫用監控用） | 書上 |
| Enterprise＋零資料留存（ZDR）協議 | **不留存**（Zero Data Retention） | 書上 |
| 是否拿來訓練模型 | 商業方案預設不用於訓練 | 待確認（以合約為準） |
| 本機對話紀錄（`~/.claude/projects/`） | 預設 30 天後清除，可用 `cleanupPeriodDays` 調整 | Claude Code 設定；書上未提 |

## 3. 合規狀態

| 項目 | 狀態 | 要索取的證明 |
| --- | --- | --- |
| SOC 2 Type II | 有（書上） | 最新一期 SOC 2 Type II 報告 |
| HIPAA | 可簽 BAA（書上） | BAA 合約 |
| ZDR | Enterprise 可簽（書上） | ZDR 條款／附約 |
| 資料駐留（地區） | 經 Bedrock／Vertex 選區域 | 雲端供應商區域設定 |

## 4. 控制措施（三層）

| 層 | 誰設定 | 能被使用者覆蓋嗎 | 本演練 |
| --- | --- | --- | --- |
| 託管設定（managed settings，MDM 派發） | IT | 不能 | 只寫範本 `managed-settings.example.json` |
| 專案設定 `.claude/settings*.json` | 技術主管 | 本機可改 | 已實作並驗證 |
| `CLAUDE.md` 規則 | 團隊 | 只是提醒 | 已加入書上原文規則；實測擋不住，見 VERIFY t7 |

## 5. 剩餘風險

1. Bash 指令換個寫法可能繞過字串型 deny → 搭配 sandbox 或 hook。
2. 個人 Pro/Max 憑證不可放在 CI 或共用機器（書上第 19 章）→ CI 用 Console API Key，定期輪替。
3. 支出失控 → 見 `SECURITY-SPEND-CHECKLIST.md` 第 B 節。
