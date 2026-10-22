# 跨 repo 交接提示詞（Cascade 第 2 步）

你在 `work/` 這個多儲存庫工作區（見 `.claude/CLAUDE.md`、`.claude/modules/billing.md`）。
`shared-contracts` 剛做了一個契約變更，最新 commit 是：給 Invoice 加上選填的 `billingPeriod`。

請**只讀不改**程式碼，產生一份跨 repo 交接文件，寫到 `.claude/handoffs/billing-period.md`。
用 `git -C shared-contracts show HEAD` 看變更內容，再讀 backend 與 frontend 的程式碼找出受影響的地方。

交接文件必須包含以下段落（繁體中文）：

1. **變更摘要**：改了什麼、為什麼、契約版本號。
2. **變更前後的 JSON 範例**：`GET /invoices/inv-001` 的回應，變更前一份、變更後一份。
3. **型別定義**：新的 `BillingPeriod` 與 `Invoice` 型別（JSDoc 與 OpenAPI 片段），列出驗證規則。
4. **各消費端要改的檔案**：分 backend、frontend 兩節，每個檔案寫「檔案路徑｜要改什麼｜要加的測試」。只列實際存在的檔案。
5. **相容性說明**：舊用戶端（不認得 billingPeriod）、舊資料（沒有 billingPeriod）、新用戶端遇到舊後端，各會怎樣；這次是否為破壞性變更。
6. **部署順序與驗收條件**：依 `.claude/CLAUDE.md` 的部署順序，列出每個 repo 完成的判斷標準。

限制：不要修改 `.claude/handoffs/` 以外的任何檔案，不要 git commit。
