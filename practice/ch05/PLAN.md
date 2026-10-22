# PLAN：RBAC（admin／editor／viewer）實作方案

> 依據 `PRD.md`。本方案在「plan 模式」角色下只讀不寫產出，核准後才進入實作。

## 1. 設計決策

| 決策 | 選擇 | 理由 |
| --- | --- | --- |
| 權限模型 | 「權限字串」而非直接比角色 | 路由只寫 `authorize("users:delete")`，角色→權限對照集中在一處，新增角色不用改路由 |
| 認證 | 靜態 token 對照表（demo） | PRD 非目標含登入流程；介面設計成之後可換 JWT |
| 欄位級權限 | 改 `role` 需要額外權限 `users:change-role` | 對應 AC6／AC8 |
| 錯誤處理 | 自訂 `HttpError` + 集中錯誤中介層 | 統一 4xx/5xx 格式，避免洩漏內部資訊 |
| 資料層 | `UserService` 類別包記憶體陣列 | 測試時每次 new 一個，避免共享狀態 |

## 2. 權限表

```ts
viewer: ["users:read"]
editor: ["users:read", "users:create", "users:update"]
admin:  ["users:read", "users:create", "users:update", "users:delete", "users:change-role"]
```

## 3. 檔案與職責

| 檔案 | 職責 |
| --- | --- |
| `src/types.ts` | `Role`、`User`、`Permission` 型別，`ROLE_PERMISSIONS`、`isRole()` |
| `src/errors.ts` | `HttpError` |
| `src/services/user.ts` | `UserService`：list／get／create／update／remove／findByToken，含驗證 |
| `src/middleware/auth.ts` | `authenticate(service)`、`authorize(permission)`、`hasPermission()` |
| `src/app.ts` | `createApp(service)`：路由＋錯誤中介層 |
| `src/server.ts` | 啟動入口（`PORT` 環境變數） |
| `tests/auth.test.ts` | 中介層單元測試 |
| `tests/user.service.test.ts` | 服務層單元測試 |
| `tests/users.api.test.ts` | supertest 整合測試，逐條對應 AC1–AC11 |

## 4. 步驟

1. [ ] `npm init`，安裝 express、typescript@5、jest、ts-jest、supertest 與型別。
2. [ ] 寫型別、錯誤類別、UserService。
3. [ ] 寫 auth 中介層。
4. [ ] 寫 app 路由與錯誤中介層。
5. [ ] 寫三組測試，`npm test` 全綠；`npx tsc --noEmit` 無錯。
6. [ ] 跑 PR 代理預審 → `PRE-REVIEW.md` → 修 high 以上。

## 5. 風險

- 靜態 token 只能 demo，已在 PRD 與程式註解標明。
- 記憶體資料重啟即消失（PRD 非目標）。
- token 比對用一般相等比較，有理論上的時序攻擊風險（demo 可接受，列入預審檢查）。
