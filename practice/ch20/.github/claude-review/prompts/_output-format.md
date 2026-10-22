
## 輸出格式（嚴格遵守）

只輸出一個 JSON 物件，不要任何其他文字、不要 markdown 圍欄：

{"dimension": "<本次審查面向>", "findings": [
  {"severity": "critical|high|medium|low",
   "tag": "sql-injection|hardcoded-secret|error-handling|resource-leak|naming|auth|logic|docs|other",
   "file": "<repo 相對路徑>",
   "line": <新版檔案中的行號，整數>,
   "title": "<一句話，繁體中文>",
   "detail": "<為什麼是問題，繁體中文>",
   "suggestion": "<怎麼修，繁體中文，可含短程式碼>"}
]}

規則：
- 只審查 diff 中「新增或修改」的行；沒問題就回傳空陣列。
- 你只能用 Read / Grep / Glob 讀取 repo 內檔案取得上下文，不可修改任何檔案。
- 同一個問題只列一次；tag 必須從上面清單挑一個最貼近的。
