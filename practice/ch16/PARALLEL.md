# 平行化模式比較（K118 第 16 章演練）

> 成本與時間欄位是本次演練的實測值（單次、小專案、Opus 系列模型），不是書上的數字；
> 標「假設值」者為推估，書上沒有對應數字。

## 一覽表

| 項目 | Mode 2：子代理（subagents） | Mode 3：git worktrees | 唯讀提問 session ＋ 開發 session |
| --- | --- | --- | --- |
| 平行單位 | 同一個 session 內派出多個子代理 | 多個獨立 session，各自一個 worktree／分支 | 兩個 session：一個只讀、一個改檔 |
| 隔離程度 | 低：共用同一個工作目錄 | 高：每個分支有自己的工作目錄與 index | 靠權限隔離（唯讀 session 不能寫） |
| 適用情境 | 一個任務可拆成「不同檔案」的子工作（測試／文件／調查） | 兩個以上獨立 feature 同時開發 | 開發中途要查程式、問問題，又不想打斷或污染開發 session 的 context |
| 本次實測時間 | 單次 `claude -p` 約 30 秒（含等子代理） | 兩個背景 session 同時跑共 31 秒（依序跑約 55 秒） | 單次查詢約 10 秒（假設值，未精確計時） |
| 本次實測成本 | 0.61 USD（主 session ＋ 2 個子代理） | 0.17 ＋ 0.16 ＝ 0.33 USD | 很低（只讀，假設值） |
| 衝突風險 | 中：子代理寫到同一檔案會互相覆蓋，必須在 prompt 劃清檔案邊界 | 開發時零衝突；**merge 時集中爆發**（本次 CHANGELOG.md add/add 衝突） | 幾乎為零：唯讀 session 不改檔 |
| 主要成本來源 | 每個子代理有自己的 context，加上主 session 彙整 | 每個 session 都要重新讀專案；merge 與解衝突需人工 | 多開一個 session 的讀檔 token |
| 收尾工作 | 主 session 彙整結果即可 | 依序 merge、解衝突、跑測試、`worktree remove`、刪分支 | 無 |

## 選擇建議

1. **子任務碰不同檔案、需要彙整成一份結果** → Mode 2。最省事，不用管分支。
2. **兩個 feature 都要改程式、會跑很久或要各自 commit** → Mode 3。開發時互不干擾，但要預留 merge 時間。
   共用檔案（CHANGELOG、設定檔、匯出入口 `index.js`）是衝突熱點，可以先在 prompt 指定「不要改共用檔」，合併時再統一補。
3. **開發 session 正在改檔，又想問「這段程式在做什麼」** → 另開唯讀 session，不要在開發 session 裡岔題。

## 唯讀提問 session 規則

設定範本：`.claude/readonly-session.settings.json`（只允許 Read／Glob／Grep 與唯讀 git 指令，明確 deny Write／Edit 與所有會改狀態的 git／檔案指令）。

啟動方式（互動式）：

```bash
claude --settings .claude/readonly-session.settings.json
```

非互動式（prompt 走 stdin，因為 `--allowedTools` 會吃掉後面的位置參數）：

```bash
echo "問題" | claude -p --setting-sources project,local \
  --settings .claude/readonly-session.settings.json \
  --allowedTools "Read,Glob,Grep,Bash(git log:*),Bash(git diff:*)"
```

使用規範：

- 唯讀 session 只回答問題、做分析，**不改檔、不 commit、不切分支**。
- 要改的東西，由唯讀 session 寫成建議，人工貼回開發 session 去做。
- 唯讀 session 看到的是磁碟上的當下狀態，開發 session 尚未存檔的修改它看不到；問之前先確認開發 session 已寫入。
- 不在唯讀 session 跑會產生檔案的指令（例如會寫 coverage 的測試）；本範本允許 `npm test` 是因為本專案測試不產生檔案。

本次驗證：要求唯讀 session 建立 `hello.txt`，結果被拒（`permission_denials` 有 1 筆），檔案沒有產生；同一次查詢正確回答 `calc.js` 的匯出函式。
