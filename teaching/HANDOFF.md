# K118 演練交接

## 原機器結果

本書沒有在其他機器演練過。第 1～10 章偏管理與策略，改成產出可直接使用的文件；第 11～22 章依書上步驟實作。差異以「和書上做法的差異」記錄。

## 快速模式進度表

| 章 | 完成日 | 實際耗時 | 和書上做法的差異 |
| --- | --- | --- | --- |
| 01 | 2026-10-22 | 4 分 | 書上無指令，改產出 DIAGNOSIS.md（四原型＋20 項診斷表）與 10 條規則的 CLAUDE.md；claude -p 驗證時被全域 Stop hook 帶去自動 commit，之後改加 --setting-sources project,local |
| 02 | 2026-10-22 | 9 分 | 書上用既有專案，改自建 3 種付款的最小 TS 模組（16 測試）並用 claude -p 重構成 strategy pattern；TS 7 與 ts-jest 不相容改釘 TS 5；數字標假設值 |
| 03 | 2026-10-22 | 3 分 | 書上偏策略，改產出 TOOL-MATRIX.md（4 工具×7 軸評分）與 HANDOFF-POLICY.md（8 關卡 24 項）；交接門檻數字書上沒有，標假設值 |
| 04 | 2026-10-22 | 3 分 | 改用 openpyxl 產生含公式的試算表＋程式自動產出一頁摘要；書上給範圍，保守取最差端、樂觀取最好端；薪資與訂閱費標假設值（基準 ROI 1343%） |
| 05 | 2026-10-22 | 11 分 | 沒有真的切 plan 模式（核准對話框會卡全自動），改唯讀產出 PLAN.md；PR 預審在本機用唯讀 claude -p 跑；第一回合中斷，教練送接續提示詞補完；42 測試全過，medium／low 未修 |
| 06 | 2026-10-22 | 3 分 | 書上偏管理，改產出四週 ROLLOUT、3 個沙盒候選（加權評分）、FAQ、反模式；評分權重與門檻標假設值 |
| 07 | 2026-10-22 | 3 分 | 用假事件 JSONL＋metrics.py 計算兩個比率（4 pytest 過）；開發者對代理比率分母改用開發者-日；遙測 hook 只寫範本不啟用 |
| 08 | 2026-10-22 | 6 分 | 自建故意 vibe 的 Flask 原型；六大面向稽核後只修 critical（12 pytest 過），N+1／migration 留在晉升檢查表 |
| 09 | 2026-10-22 | 4 分 | deny 規則用 claude -p 實測 9 項（含 bypass 模式仍被擋、對照組不載 local 會讀到）；託管設定只寫範本；git reset --hard 未實測 |
| 10 | 2026-10-22 | 5 分 | 改產出 SCALING 決策表、prompt-library（4 提示詞）、三種 CLAUDE.md 範本、分享會議程；用 claude -p 實跑一個測試生成提示詞，其餘範本未實跑 |
| 11 | 2026-10-22 | 4 分 | 隔離模式（只載專案層設定），開窗先選允許外部 CLAUDE.md 匯入；四週 Harness 三項 claude -p 實測全過；已知漏洞：用 Bash 寫 .sql 不會被 hook 擋 |
| 12 | 2026-10-22 | 6 分 | 用 claude -p 代替互動式 /init（56 行）再整理成三層（根 60 行＋src/api＋User 層只寫範本）；health 端點 10 條慣例全遵守；--allowedTools 會吃掉 prompt 參數改用 stdin |
| 13 | 2026-10-22 | 12 分 | 五階段全跑；Modernize 用 git worktree 開 migrate/users 後 merge 並清掉；型別用 JSDoc＋@ts-check 不改 .ts；舊 bug 刻意保留由表徵測試鎖住（22 測試過） |
| 14 | 2026-10-22 | 9 分 | Scaffold-First 做短網址服務：CLAUDE.md→13 個 it.todo 骨架→四組逐一轉綠各一 commit；書上 Contract／Test Cards 沒做 |
