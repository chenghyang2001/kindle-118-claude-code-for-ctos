# NOTES — 第 1 章「CTO 的現實」演練紀錄

## 做了什麼

| 產出 | 內容 |
| --- | --- |
| `DIAGNOSIS.md` | 四種 CTO 原型（Solo／Small Team／Mid-Size／Scaling）的核心瓶頸與 AI 導入第一步；20 項可勾選的「團隊瓶頸診斷表」（A～D 四區各 5 項）＋判讀表 |
| `CLAUDE.md` | 在原檔前面加上虛構 Node.js SaaS「TaskFlow」的 10 條架構規範與常用指令；原「本專案例外」段落保留在最後 |
| `.gitignore` | 排除 hook 產生的 `.claude/session-state.md` 與當機垃圾檔 |

資料來源：`~/workspace/kindle-118-claude-code-for-ctos/teaching/ask/ch1-6.txt`（NotebookLM 對書 PDF 的章節摘要）。本章書上沒有指令操作，所以產出都是文件。

## 驗證結果

| 檢查 | 結果 |
| --- | --- |
| 架構規範條數 ≤ 10 | 10 條 ✅ |
| 診斷表勾選項 | 20 項 ✅ |
| 「本專案例外」段落與原檔逐行一致 | ✅（diff 無差異） |
| `claude -p` 能讀到新的 CLAUDE.md | ✅ 問「第 2 條是什麼」，正確回答「多租戶隔離 / `scoped(tenantId)`」 |

### 意外狀況（照實記錄）

第一次跑 `claude -p` 時，子 session 沒回答問題，而是被**全域 Stop hook** 驅使，自行把 `CLAUDE.md`、`DIAGNOSIS.md` commit 了（`ed11bb6`），還留下 `.claude/session-state.md`。

- commit 內容就是本演練寫的版本，沒有被改動；本 repo 沒有 remote，所以沒有 push。
- 第二次改用 `claude -p --settings '{"disableAllHooks":true}'`（只對該次執行生效，沒動全域設定）就正常回答。
- 心得：之後各章用 `claude -p` 驗證時，建議都加 `--settings '{"disableAllHooks":true}'`，否則全域 hook 會讓子 session 做出題目以外的動作。

## 和書上做法的差異

1. **書上沒有動手操作**，只建議產出「CTO 團隊瓶頸診斷表」與「初步 CLAUDE.md 規範草案」；本演練把兩者實際寫出來。
2. **書上細節不完整**：NotebookLM 摘要只明確列出三種瓶頸（個人頻寬、做法分歧、組織變革抗力）。Mid-Size 的瓶頸、各原型的人數區間、每個原型的「第一步」是依書中主軸推論，文件內已用【推論】／【假設值】標記，需對照原書修正。
3. **TaskFlow 是虛構範例**：技術堆疊、指令、分頁 20 筆、「一年無發版」等數字都是假設值，不是書上的建議。
4. 本章不涉及全域設定、MCP、plugin、API key，所以共通限制中的這些項目沒有觸發。
