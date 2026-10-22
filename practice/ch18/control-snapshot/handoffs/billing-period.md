# 交接文件：Invoice 新增選填欄位 `billingPeriod`（契約 v1.1.0）

- 變更代號：`billing-period`（三個 repo 的 commit 訊息請都引用這個代號）
- 來源 commit：`shared-contracts@7e54e6b`「新增 Invoice 選填欄位 billingPeriod（契約 v1.1.0）」
- 受影響 repo：`backend`、`frontend`
- 模組文件：`.claude/modules/billing.md`

---

## 1. 變更摘要

**改了什麼**

| 檔案（shared-contracts） | 變更 |
| --- | --- |
| `types/billing/invoice.js` | 新增 `BillingPeriod` typedef；`Invoice` 加上選填的 `billingPeriod`；新增並匯出 `isIsoDate()`、`validateBillingPeriod()`；`validateInvoice()` 在 `billingPeriod !== undefined` 時才驗證它 |
| `openapi/billing.yaml` | `info.version` 從 1.0.0 改成 1.1.0；新增 `components.schemas.BillingPeriod`；`Invoice.properties` 加上 `billingPeriod`（不放進 `required`） |
| `types/billing/invoice.test.js` | 新增 3 個測試：沒帶也合法、合法值會通過、各種非法值會被擋下 |
| `package.json` | `version` 從 1.0.0 改成 1.1.0 |
| `CHANGELOG.md` | 新增檔案，記錄 1.1.0 是新增、非破壞性的變更 |

**為什麼**：發票要能標出它涵蓋的計費期間，例如月費方案的「2026-10-01 ～ 2026-10-31」，用戶端才不必從其他欄位推算。

**契約版本號**：`1.0.0` → **`1.1.0`**（minor 升版：只新增選填欄位，非破壞性）。

---

## 2. 變更前後的 JSON 範例

`GET /invoices/inv-001` 的 200 回應。

**變更前（契約 1.0.0，也就是 backend 目前的回應）**

```json
{
  "id": "inv-001",
  "customerId": "cust-42",
  "status": "issued",
  "currency": "TWD",
  "lines": [{ "sku": "PLAN-PRO", "quantity": 1, "unitPrice": 99000 }],
  "total": 99000
}
```

**變更後（契約 1.1.0，backend 改完後的目標回應）**

```json
{
  "id": "inv-001",
  "customerId": "cust-42",
  "status": "issued",
  "currency": "TWD",
  "lines": [{ "sku": "PLAN-PRO", "quantity": 1, "unitPrice": 99000 }],
  "total": 99000,
  "billingPeriod": { "start": "2026-10-01", "end": "2026-10-31" }
}
```

> 期間值 `2026-10-01`～`2026-10-31` 是示範用的假設值，跟契約裡的 `example` 一致。真正的期間要由 backend 的資料來源決定。

---

## 3. 型別定義

### JSDoc（`shared-contracts/types/billing/invoice.js`）

```js
/**
 * 計費期間（v1.1.0 新增）。日期為 ISO 8601 日曆日期 "YYYY-MM-DD"，兩端皆含。
 * @typedef {Object} BillingPeriod
 * @property {string} start  例如 "2026-10-01"
 * @property {string} end    例如 "2026-10-31"，不可早於 start
 */

/**
 * @typedef {Object} Invoice
 * @property {string} id
 * @property {string} customerId
 * @property {"draft"|"issued"|"paid"|"void"} status
 * @property {string} currency  ISO 4217，例如 "TWD"
 * @property {InvoiceLine[]} lines
 * @property {number} total  由 lines 計算，單位為「分」
 * @property {BillingPeriod} [billingPeriod]  選填：舊資料與舊用戶端可以沒有這個欄位
 */
```

匯出：`module.exports = { INVOICE_STATUSES, isIsoDate, validateBillingPeriod, validateInvoice }`

### OpenAPI（`shared-contracts/openapi/billing.yaml`）

```yaml
info:
  version: 1.1.0
components:
  schemas:
    BillingPeriod:
      type: object
      description: 計費期間（v1.1.0 新增，選填；兩端皆含）
      required: [start, end]
      properties:
        start: { type: string, format: date, example: "2026-10-01" }
        end: { type: string, format: date, example: "2026-10-31" }
    Invoice:
      type: object
      required: [id, customerId, status, currency, lines, total]   # billingPeriod 不在 required
      properties:
        # ……原有欄位不變……
        billingPeriod:
          $ref: "#/components/schemas/BillingPeriod"
```

### 驗證規則（`validateInvoice` / `validateBillingPeriod`）

| # | 規則 | 違反時的錯誤訊息 |
| --- | --- | --- |
| 1 | `billingPeriod` 是 `undefined`（沒帶）就**跳過驗證**，視為合法 | — |
| 2 | 有帶的話必須是非 `null` 的物件。**`null` 不合法** | `billingPeriod 必須是物件 {start, end}` |
| 3 | `start` 必須符合 `^\d{4}-\d{2}-\d{2}$`，而且是真的存在的日期（`2026-02-30` 不行） | `billingPeriod.start 必須是 YYYY-MM-DD` |
| 4 | `end` 的規則同上 | `billingPeriod.end 必須是 YYYY-MM-DD` |
| 5 | 3、4 都通過時，`start <= end`（字串字典序比較；兩端皆含，所以同一天合法） | `billingPeriod.start 不可晚於 end` |

注意事項：
- 只能「不帶這個欄位」，不能送 `null`。backend 序列化時，沒有期間的發票要**省略整個欄位**，不能輸出 `"billingPeriod": null`。
- 日期不帶時間和時區（`2026-10-01T00:00:00Z` 不合法）。

---

## 4. 各消費端要改的檔案

> 兩個 repo 都用相對路徑 `require("../../../shared-contracts/types/billing/invoice")` 引用契約，沒有釘版本。所以只要同級目錄的 shared-contracts 拉到 1.1.0，兩邊的 `validateInvoice` 就會**立刻**套用新規則，不需要改 import。

### backend

| 檔案路徑 | 要改什麼 | 要加的測試 |
| --- | --- | --- |
| `backend/src/billing/invoice-service.js` | 在示範資料 `INVOICES["inv-001"]` 加上 `billingPeriod: { start: "2026-10-01", end: "2026-10-31" }`。建議再加一筆沒有 `billingPeriod` 的舊資料（例如 `inv-000`），用來證明向後相容。`getInvoice()` 本身不用改，原本就會在回傳前呼叫 `validateInvoice`，非法期間會拋錯 | 見下一列 |
| `backend/src/billing/invoice-service.test.js` | 新增測試 | ①`getInvoice("inv-001").billingPeriod` 等於 `{ start: "2026-10-01", end: "2026-10-31" }`；②沒有期間的舊資料仍能正常取得，而且結果**不含** `billingPeriod` 這個 key（`!("billingPeriod" in inv)`），不能是 `null`；③原有的 2 個測試（total、null）維持通過 |
| `backend/src/server.js` | **不用改程式碼**。`send()` 直接 `JSON.stringify(invoice)`，新欄位會原樣輸出；違反契約時由 `getInvoice` 拋錯，最後回 500 | 這個 repo 目前**沒有** server 的測試檔。建議新增 `backend/src/server.test.js`（新檔），用 `handleRequest` 搭配 `http.createServer` 監聽隨機 port：`GET /invoices/inv-001` 回 200 而且 body 含 `billingPeriod`；`GET /invoices/nope` 回 404 |

### frontend

| 檔案路徑 | 要改什麼 | 要加的測試 |
| --- | --- | --- |
| `frontend/src/billing/invoice-view.js` | `formatInvoice()`：驗證之後，**有** `billingPeriod` 時在輸出加上一段，例如 `｜期間 2026-10-01 ～ 2026-10-31`；**沒有**時照舊輸出，不能顯示 `undefined`。驗證邏輯不用自己寫，沿用 `validateInvoice` | 見下一列 |
| `frontend/src/billing/invoice-view.test.js` | 新增測試 | ①帶合法 `billingPeriod` 時，輸出符合 `/期間 2026-10-01 ～ 2026-10-31/`；②不帶 `billingPeriod`（舊後端回應）時，輸出不含「期間」也不含 `undefined`，原有的 `/990\.00 TWD/` 仍然符合；③`billingPeriod` 非法（`start` 晚於 `end`，或是 `null`）時 `formatInvoice` 會拋錯 |
| `frontend/src/cli.js` | **不用改**。它只負責 fetch，然後交給 `formatInvoice` | 不需要新增。上線後用 `node src/cli.js inv-001` 做手動煙霧測試 |

---

## 5. 相容性說明

| 情境 | 結果 |
| --- | --- |
| **舊用戶端**（不認得 `billingPeriod`）收到新後端的回應 | ✅ 正常。舊版 `validateInvoice`（1.0.0）只檢查已知欄位，不會因為多一個欄位而報錯；舊版 `formatInvoice` 也只讀固定欄位。新欄位會被默默忽略 |
| **舊資料**（沒有 `billingPeriod`）經過新後端 | ✅ 正常。1.1.0 的 `validateInvoice` 遇到 `undefined` 會跳過（shared-contracts 的測試「billingPeriod 選填：沒帶仍合法」涵蓋這點）。回應裡不會出現這個欄位 |
| **新用戶端**遇到**舊後端**（回應沒有 `billingPeriod`） | ✅ 正常，**前提是** frontend 照第 4 節處理「沒有期間」的分支。要是 frontend 直接讀 `invoice.billingPeriod.start` 會丟 TypeError，所以第 4 節的測試②是必備的 |
| 後端送出 `"billingPeriod": null` 或格式錯的期間 | ❌ 新後端自己的 `getInvoice` 會拋錯，`GET` 回 **500**；新用戶端也會拋出「後端回應違反契約」。所以 backend 一定要省略欄位，不能送 `null` |

**是否為破壞性變更：否。** 只新增選填欄位，沒有刪改既有欄位或型別，也沒有改 `required`，所以 minor 升版到 1.1.0，不需要拆成兩階段（新增並雙寫 → 移除舊欄位）。

風險提醒：backend 和 frontend 都用相對路徑引用同級的 shared-contracts，沒有鎖版本。在同一台機器上，只要 shared-contracts 拉到 1.1.0，兩邊的驗證規則就會同時變新。部署時請確認各環境拿到的 shared-contracts 版本符合下面的順序。

---

## 6. 部署順序與驗收條件

依 `.claude/CLAUDE.md` 的硬規則：**shared-contracts → backend → frontend**。

### 第 1 步：shared-contracts（已完成 commit，待發佈）

- [ ] `package.json` 和 `openapi/billing.yaml` 的版本都是 `1.1.0`，`CHANGELOG.md` 有 1.1.0 的條目
- [ ] `cd shared-contracts && npm test` 全部通過，包含新增的 3 個 billingPeriod 測試
- [ ] **還沒改** backend 和 frontend 時，在兩個 repo 跑 `npm test` 仍然全綠，證明新契約向後相容
- [ ] 發佈或標記 1.1.0（例如 git tag `v1.1.0`）之後，才能進行第 2 步

### 第 2 步：backend

- [ ] `invoice-service.js` 已更新示範資料（有期間的 `inv-001`，加上沒有期間的舊資料）
- [ ] `cd backend && npm test` 全部通過，包含第 4 節的新測試
- [ ] 手動驗證：`npm start` 之後 `curl http://localhost:3000/invoices/inv-001`，回應和第 2 節「變更後」的 JSON 一致；沒有期間的發票，回應裡沒有 `billingPeriod` 這個 key
- [ ] 用**舊版 frontend**（還沒改的 `formatInvoice`）跑 `node src/cli.js inv-001`，仍然正常輸出，證明舊用戶端相容
- [ ] commit 訊息引用變更代號 `billing-period`

### 第 3 步：frontend（最後）

- [ ] 確認 backend 新版已經上線（第 2 步全部打勾）
- [ ] `invoice-view.js` 已處理「有期間」和「沒有期間」兩種分支
- [ ] `cd frontend && npm test` 全部通過，包含第 4 節的新測試
- [ ] 手動驗證：`node src/cli.js inv-001` 的輸出含「期間 2026-10-01 ～ 2026-10-31」；對沒有期間的發票或舊後端，輸出跟原本一樣，沒有 `undefined`
- [ ] commit 訊息引用變更代號 `billing-period`

### 整體完成的判斷標準

- 三個 repo 的 `npm test` 都是綠的
- `frontend → backend` 實際串接時，能顯示 `inv-001` 的計費期間
- 沒有任何 repo 在 shared-contracts 之外重複定義 `BillingPeriod` 型別或驗證邏輯
