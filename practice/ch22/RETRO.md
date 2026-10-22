# K118《Claude Code for CTOs》全書演練回顧

依 `teaching/HANDOFF.md` 進度表整理，第 22 章為本次。全部用快速 demo 模式（主 Claude 直接寫、只跑冒煙測試）。

## 數字總覽

| 項目 | 數值 |
| --- | --- |
| 章數 | 22（第 1–10 章管理策略、第 11–22 章實作） |
| 第 1–21 章合計耗時 | 120 分（HANDOFF 表加總） |
| 第 22 章耗時 | 約 10 分 |
| 全書合計 | 約 130 分，平均每章約 6 分 |
| 最久 | 第 13 章 12 分（五階段 legacy 改造）、第 5 章 11 分（中斷後接續） |
| 最快 | 3 分（第 3、4、6、7、19、21 章，多為純文件） |

## 分段回顧

| 段落 | 章 | 做法 | 收穫 |
| --- | --- | --- | --- |
| 診斷與評估 | 1–4 | 書上沒指令，改產出診斷表、工具矩陣、ROI 試算表 | 數字大多書上沒有，要大量標「假設值」 |
| 規劃與導入 | 5–10 | PLAN、四週 rollout、指標計算、vibe 原型稽核、deny 規則實測、範本庫 | 第 9 章 deny 在 bypass 模式仍有效，是最有價值的實測 |
| Harness 與 CLAUDE.md | 11–12 | 專案層 harness、三層 CLAUDE.md | 發現 `--allowedTools` 會吃掉後面的 prompt 參數 → 改 stdin |
| 既有程式碼與 Scaffold | 13–15 | 表徵測試、worktree 遷移、it.todo 骨架、context 前置載入 | 第 15 章前置載入：讀檔 5 vs 13，第二輪省約兩成 token |
| 平行與多 repo | 16–18 | 子代理、雙 worktree、控制區、Cascade 四步 | worktree 在 Git Bash 要 `cygpath -m`；子 session 不能寫 `.claude/` |
| 資安、CI、產品 | 19–21 | 只寫範本與檢查表、本機模擬 CI 審查 | AI 審查項數每次不同，不適合當硬門檻 |
| MCP 與附錄 | 22 | 186 行 Python MCP server、專案層掛載、claude -p 實呼叫 | `mcp` 已是 2.x，FastMCP 改名 MCPServer |

## 反覆出現的坑（下次直接套用）

1. `claude -p` 一定加 `--setting-sources project,local` 並清 `CLAUDE*` 環境變數，否則全域 Stop hook 會讓子 session 自己 commit（第 1 章踩到）。
2. `--allowedTools` 後面接 prompt 會被吃掉 → prompt 一律用 stdin（第 12 章）。
3. 套件版本要釘：TypeScript 釘 5（第 2 章）、mcp 2.x API 改名（第 22 章）。
4. 子 session 寫 `.claude/` 會被擋 → 由子 session 輸出全文、外層存檔（第 18 章）。
5. 書上要全域、託管、Console 的設定，一律改成專案層或只寫範本（第 9、19、20 章）。

## 和書的整體差異

- 書是寫給 CTO 的，前半幾乎沒有指令；演練把「讀完要做的決定」轉成可交付文件，比照書上的檢查表格式。
- 需要第三方帳號的（GitHub Actions、Slack、SIEM、雲端代理）只寫範本，未實際連線。
- 多終端分頁、互動式 `/init`、plan 模式核准等互動步驟，都改用 `claude -p` 代替，全自動可行但看不到互動體驗。

## 如果重來

- 第 1 章就先把 `claude -p` 的標準參數寫成腳本，後面每章直接呼叫。
- 管理章節的假設值集中到一份 `ASSUMPTIONS.md`，避免各章數字不一致。
- 第 22 章的 MCP server 可以回頭接第 18 章的多 repo，當成真正的部署查詢入口。
