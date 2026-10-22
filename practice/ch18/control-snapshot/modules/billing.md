# billing 模組：跨 repo 檔案位置

| 層 | repo | 檔案 | 說明 |
| --- | --- | --- | --- |
| 契約（型別） | `shared-contracts` | `types/billing/invoice.js` | **發票型別 `Invoice` / `InvoiceLine` 的定義**（JSDoc `@typedef`）＋ `validateInvoice()` |
| 契約（API） | `shared-contracts` | `openapi/billing.yaml` | `GET /invoices/{id}` 與 `components.schemas.Invoice` |
| 服務 | `backend` | `src/billing/invoice-service.js` | `getInvoice(id)`，回傳前用 `validateInvoice` 檢查 |
| 路由 | `backend` | `src/server.js` | `GET /invoices/:id` → 200 / 404 / 500 |
| 顯示 | `frontend` | `src/billing/invoice-view.js` | `formatInvoice()`，驗證後格式化 |
| 進入點 | `frontend` | `src/cli.js` | 呼叫 backend（`BACKEND_URL`） |

## 修改發票型別的步驟

1. 改 `shared-contracts/types/billing/invoice.js`，同步改 `openapi/billing.yaml` 的 `Invoice` schema
2. 跑三個 repo 的 `npm test`
3. 依部署順序 **shared-contracts → backend → frontend** 部署

## 注意

- 金額欄位（`unitPrice`、`total`）一律以「分」為單位的整數。
- `status` 列舉：`draft` / `issued` / `paid` / `void`。新增狀態時 frontend 要最後部署。

## 變更紀錄

| 代號 | 契約版本 | 內容 | 交接文件 |
| --- | --- | --- | --- |
| `billing-period` | 1.1.0 | `Invoice` 新增選填 `billingPeriod: {start, end}`（ISO 日期）；沒有期間時**省略欄位，不可為 null** | `handoffs/billing-period.md` |

跨 repo 交接提示詞範本：`prompts/cross-repo-handoff.md`。
