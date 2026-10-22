# 共享提示詞庫（prompt-library）

團隊共用、經過審查的 Claude Code 提示詞。書上稱為 Internal Prompt Library Repo，
收錄通過審查（Lint）的 SQL 遷移與測試生成提示詞。

## 目錄

```
prompt-library/
├── README.md                     ← 本檔
├── sql-migration/
│   ├── add-column-safe.md        ← 安全新增欄位（可回滾）
│   └── backfill-batched.md       ← 分批回填資料
├── test-generation/
│   ├── unit-tests-from-function.md  ← 單一函式產生單元測試
│   └── regression-test-from-bug.md  ← 依 bug 報告寫回歸測試
└── examples/                     ← 實際跑過的結果
```

## 每個提示詞檔的格式

| 區段 | 說明 |
| --- | --- |
| 適用情境 | 什麼時候用、什麼時候**不要**用 |
| 變數 | `{{VAR}}` 形式，使用前全部替換 |
| 提示詞 | 可直接貼給 Claude Code 的全文 |
| 範例 | 一組填好變數的實例＋預期輸出重點 |
| 維護資訊 | 負責人、最後驗證日期 |

## 怎麼用

1. 找到提示詞檔，複製「提示詞」區段。
2. 把所有 `{{VAR}}` 換成實際值（漏換的話 Claude 會照字面理解）。
3. 互動模式：直接貼上。Headless：

   ```bash
   claude -p "$(cat prompt-library/test-generation/unit-tests-from-function.md | sed -n '/^```prompt/,/^```$/p' | sed '1d;$d')"
   ```

   實際跑法見 `examples/run-test-generation.sh`。

## 怎麼貢獻

1. 在每週分享會（`SHOWCASE-AGENDA.md`）分享過、至少有 1 次實際成功紀錄。
2. 照上方格式寫，放進對應子目錄，檔名用小寫加連字號。
3. 開 PR，至少 1 位審查者（Hub-and-Spoke 為中央團隊成員）。
4. 審查檢查：有「不要用」情境、變數都有說明、範例可重現、無機密與內部網址。
5. 每月檢視一次，3 個月沒人用就移除（假設值）。
