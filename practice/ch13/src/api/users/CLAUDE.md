# users 模組

- 狀態：已遷移成 async/await + `// @ts-check`（型別在 `users.types.js`，資料存取走 `src/db/usersRepo.js`）；回應格式尚未改 JSend。
- 行為由 `tests/users.characterization.test.js` 鎖住；改這個模組前先跑 `npm test`。
- 回應格式是舊式（裸 JSON、錯誤 `{error}`），**不是** JSend。遷移時不可改格式。
- 已知但刻意保留的 bug（另開票修）：回應帶 `password`、非數字 id 回 404、email 不檢查重複。
- `legacyExportCsv` 與 `/export.csv` 是死碼（flag 永遠 false）。遷移時已順手轉成 async（否則會有型別錯誤），整段移除另開票（AUDIT_REPORT P12）。
