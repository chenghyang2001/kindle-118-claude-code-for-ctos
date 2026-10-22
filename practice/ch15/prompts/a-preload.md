任務：在 order 加入 priority 欄位與「依優先度列出訂單」功能。

【前置載入：只需要讀、改以下 4 個檔，不要讀或搜尋其他檔案】
1. app/src/models/order.js
   - FIELDS 陣列加入 'priority'
   - @typedef Order 加 `@property {'low'|'normal'|'high'} [priority]`
   - validateOrder：priority 有值時必須是 'low' | 'normal' | 'high' 之一，否則 push 'priority 必須是 low/normal/high'
   - buildOrder：priority 預設 'normal'（`input.priority ?? 'normal'`）
2. app/src/services/order.js
   - 回傳物件新增 `listByPriority(priority)`：回傳 store.all() 中 priority 相符者
3. app/src/routes/order.js
   - 新增路由 `'GET /orders/priority/:priority'` → 200 + service.listByPriority(req.params.priority)
4. app/test/order.test.js
   - 新增測試：預設 priority 為 'normal'、非法值被拒（validateOrder 有錯）、新路由只回傳相符訂單

注意：app/test/router.test.js 斷言總路由數為 40，新增路由後要改成 41（這是第 5 個要改的檔，只改那個數字）。

驗證：在 app/ 執行 `npm test`，全部通過即完成。不要 commit。完成後一句話回報改了哪些檔。
