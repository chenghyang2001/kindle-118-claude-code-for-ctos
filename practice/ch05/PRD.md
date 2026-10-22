# PRD：最小 RBAC 使用者服務（K118 第 5 章演練）

> 依書上「標準 PRD」五大區塊撰寫。書上沒有的數字一律標「假設值」。

## 1. 問題與成功指標

**問題**：內部管理 API 目前沒有權限控管，任何持有 token 的人都能讀寫、刪除使用者資料，有誤刪與越權風險。

**目標**：在 Express＋TypeScript 服務中加入角色型存取控制（RBAC），三個角色 admin／editor／viewer。

**成功指標**

| 指標 | 目標值 |
| --- | --- |
| 越權請求被擋下的比例 | 100%（假設值） |
| 驗收條件自動化測試覆蓋 | 每條 AC 至少 1 個測試（假設值） |
| 未帶／無效 token 的回應碼 | 一律 401 |
| 角色不足的回應碼 | 一律 403 |

## 2. 角色與權限的使用者故事

| 角色 | 使用者故事 |
| --- | --- |
| admin | 身為 admin，我要能列出、查看、建立、更新、刪除使用者，並能變更他人角色，才能管理整個系統。 |
| editor | 身為 editor，我要能列出、查看、建立與更新使用者基本資料（不含角色），才能維護內容，但不能刪人或改角色。 |
| viewer | 身為 viewer，我只要能列出與查看使用者，不能做任何修改。 |
| 未登入 | 身為未登入的呼叫者，我的任何請求都應被拒絕（401）。 |

權限矩陣：

| 動作 | admin | editor | viewer |
| --- | :---: | :---: | :---: |
| `GET /users`、`GET /users/:id` | ✅ | ✅ | ✅ |
| `POST /users` | ✅ | ✅ | ❌ |
| `PATCH /users/:id`（name、email） | ✅ | ✅ | ❌ |
| `PATCH /users/:id`（role） | ✅ | ❌ | ❌ |
| `DELETE /users/:id` | ✅ | ❌ | ❌ |

## 3. 可測試驗收條件（AC）

- **AC1**：未帶 `Authorization` 標頭 → 401。
- **AC2**：token 無效或對應不到使用者 → 401。
- **AC3**：viewer 呼叫 `GET /users` → 200，回傳陣列。
- **AC4**：viewer 呼叫 `POST /users` → 403。
- **AC5**：editor 呼叫 `POST /users` 且資料合法 → 201，新使用者角色預設 viewer。
- **AC6**：editor 嘗試把任何人的 role 改掉 → 403。
- **AC7**：editor 呼叫 `DELETE /users/:id` → 403；admin 呼叫 → 204。
- **AC8**：admin 呼叫 `PATCH /users/:id` 改 role 為合法值 → 200；非法 role 值 → 400。
- **AC9**：`GET /users/:id` 查不存在的 id → 404。
- **AC10**：建立使用者缺 name 或 email 格式錯誤 → 400；email 重複 → 409。
- **AC11**：admin 不能刪除自己（避免系統沒有管理員）→ 400。

## 4. 流程與邊界

```
請求 → authenticate（解析 Bearer token → req.user）
     → authorize(permission)（查角色權限表）
     → 參數驗證 → userService → 回應
```

邊界情況：

- `Authorization` 格式不是 `Bearer <token>`（例如 `Basic xxx`、空字串）→ 401。
- role 欄位大小寫不同（`Admin`）視為非法 → 400。
- id 不是數字 → 404（找不到），不洩漏內部錯誤。
- 未知錯誤一律 500 且只回 `{ error: "Internal server error" }`。
- 錯誤訊息不回傳 token 或堆疊。

## 5. 技術備註

- Node.js＋Express 4、TypeScript 5（釘 `typescript@5`，TS 7 與 ts-jest 不相容）。
- 測試：Jest＋ts-jest＋supertest。
- 資料層：記憶體內陣列（demo 用，不接資料庫）。
- 認證：demo 用靜態 token 對照表（**不是**正式做法，正式環境應換成 JWT／OIDC）。
- 檔案：`src/middleware/auth.ts`、`src/services/user.ts`、`src/app.ts`、`src/server.ts`。
- 非目標：註冊／登入流程、密碼、持久化、稽核日誌。
