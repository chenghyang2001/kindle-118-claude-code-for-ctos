# NOTES：K118 第 10 章「擴大採用」快速演練

> 快速 demo 模式：主 Claude 直接寫檔，未經 code-qa／code-reviewer 審查。

## 做了什麼

1. **`SCALING.md`**：Guild／Hub-and-Spoke／Embedded Champions 決策表（規模門檻、組織形式、優缺點、產出、人力成本、升級時機）＋三種模式各自的啟動步驟。
2. **`prompt-library/`** 共享提示詞庫：
   - `README.md`：目錄、檔案格式、使用方式（互動／headless）、貢獻與審查流程。
   - `sql-migration/add-column-safe.md`、`sql-migration/backfill-batched.md`
   - `test-generation/unit-tests-from-function.md`、`test-generation/regression-test-from-bug.md`
   - 每檔都有：適用情境（含「不要用」）、變數表、提示詞全文、範例、維護資訊。
3. **`.claude/templates/`**：`react-frontend.CLAUDE.md`、`node-api.CLAUDE.md`、`python-data-pipeline.CLAUDE.md`。
4. **`SHOWCASE-AGENDA.md`**：每週 30 分鐘分享會議程，講者照書上三段格式（成功提示詞／失敗案例／CLAUDE.md 改進）。
5. **實跑**：`prompt-library/examples/run-test-generation.sh` 取出 `unit-tests-from-function.md` 的提示詞、替換變數，用 `claude -p` 對 `pricing.py` 的 `apply_discount` 產生測試，再跑 pytest。

## 驗證結果

| 項目 | 結果 |
| --- | --- |
| `bash -n run-test-generation.sh` | 通過 |
| `claude -p`（`--setting-sources project,local`、先清 CLAUDE* 環境變數、`--allowedTools Read,Write,Edit,Glob,Grep`） | 約 64 秒，產出 `test_pricing.py` 與 `claude-output.md` |
| pytest（專案 `.venv`，uv 安裝 pytest 9.1.1） | **37 passed** |
| 提示詞要求「不確定的寫待確認」 | 有效：Claude 標出 7 個待確認案例，並指出 docstring 寫「四捨五入」但 `round()` 是銀行家捨入（2.5→2）、`rate` 可傳 bool 導致免費等實作疑點 |
| 子 session 有沒有自己 commit | 沒有（排除了全域 Stop hook） |

產出檔：`prompt-library/examples/unit-tests-from-function/`（`pricing.py`、`prompt-used.txt`、`test_pricing.py`、`claude-output.md`、`pytest-result.txt`）。

註：子 session 的 `claude-output.md` 說「還沒跑過 pytest」，因為只給了檔案工具沒給 Bash；測試是腳本在之後另外跑的。

## 和書上做法的差異

| 項目 | 書上 | 本演練 |
| --- | --- | --- |
| 提示詞庫 | 獨立的內部 GitHub/GitLab repo，提示詞要通過 Lint 審查 | 同 repo 的 `prompt-library/` 子目錄；審查流程只寫在 README，沒有接 CI lint |
| 分享管道 | Slack/Teams 頻道（`#claude-code`、`#ai-dev`） | 需要第三方帳號，只在文件中提到頻道名稱 |
| `FAQ.md`、`ANTI_PATTERNS.md` | 書上列為要建的檔案 | 本次任務未要求，沒建；只在 SCALING 與範本中引用「禁止讓 AI 從頭設計 DB Schema」 |
| 範本位置 | `.claude/templates/` | 相同 |
| 分享會 | 每週 30 分鐘，每位講者 1 成功＋1 失敗＋1 CLAUDE.md 建議 | 相同，另外補了時間切分與會後待辦表 |

**假設值**（書上沒有的數字）：邊界 25–35／90–110 人的處理、Guild 發起人 2–3 位、中央團隊排隊超過 2 週即升級、試點 2 週、Champion 雙週例會、每季檢視、每月檢視提示詞且 3 個月沒人用即移除、分享會 2 位講者 × 10 分鐘與時段、回填「< 1 萬筆不用分批」。

## 已知風險

- SQL migration 兩個提示詞未實跑，只是範本。
- 三個 CLAUDE.md 範本沒有套到真實專案驗證。
- `run-test-generation.sh` 用 sed 取 ```` ```prompt ```` 區塊，提示詞內若出現同樣的圍欄會切錯。
