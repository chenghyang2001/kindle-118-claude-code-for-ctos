# VERIFY：spanning session 能從控制區答對 billing 問題

## 執行方式

```bash
cd work
for v in $(env | grep -o '^CLAUDE[A-Z_]*'); do unset "$v"; done   # 先清 CLAUDE* 環境變數（清完計數 = 0）
echo "billing 的發票型別定義在哪個 repo 哪個檔、改它要依什麼順序部署？請簡短回答並註明你是從哪個檔案得知的。" \
  | claude -p --setting-sources project,local
```

- 工作目錄：`work/`（父目錄，不是 repo）
- `--setting-sources project,local`：排除全域設定與全域 hook，避免子 session 自己 commit
- prompt 走 stdin；exit code = 0
- 日期：2026-10-22，Claude Code 2.1.308

## claude -p 原始回答

> - **位置**：`shared-contracts` repo 的 `types/billing/invoice.js`，`Invoice`／`InvoiceLine` 是用 JSDoc `@typedef` 定義的。
> - **連帶修改**：改型別時，要一起改同一個 repo 裡 `openapi/billing.yaml` 的 `Invoice` schema。
> - **部署順序**：**shared-contracts → backend → frontend**。先讓提供端上線，消費端最後上線。如果要刪欄位或改型別這類破壞性變更，要分兩階段：先新增欄位、新舊兩邊同時寫，等 frontend 改完再移除舊欄位。
>
> **資料來源**：
>
> - 檔案位置和修改步驟來自 `work/.claude/modules/billing.md`（第 5、14–16 行）。
> - 部署順序的硬規則和兩階段做法來自 `work/.claude/CLAUDE.md` 的「部署順序規則」一節。
>
> 這些都是從文件讀到的，我沒有打開 `invoice.js` 本身確認。

## 判定

| 檢查項 | 預期 | 結果 |
| --- | --- | --- |
| repo | `shared-contracts` | ✅ |
| 檔案 | `types/billing/invoice.js` | ✅ |
| 部署順序 | shared-contracts → backend → frontend | ✅ |
| 資訊來源是控制區 | `work/.claude/CLAUDE.md` + `modules/billing.md` | ✅（回答自己點名這兩個檔） |
| 子 session 沒有副作用 | 三個 repo 各 1 個 commit、工作樹乾淨 | ✅ |

**結論：PASS**。從 `work/` 開的 session 會自動載入 `work/.claude/CLAUDE.md`，並依它的指引去讀 `modules/billing.md`。

## 其他驗證

- 三個 repo 的 `node --test`：各 2 pass / 0 fail
- 端到端：backend 起在 3917 埠，frontend 印出 `發票 inv-001｜客戶 cust-42｜狀態 issued｜總額 990.00 TWD`；查不存在的 `nope` 回 HTTP 404 並顯示錯誤訊息
- `work/` 沒有 `.git`（不是 repo）
