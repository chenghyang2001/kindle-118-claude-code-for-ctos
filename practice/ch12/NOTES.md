# NOTES：K118 第 12 章「CLAUDE.md」快速演練

> 快速 demo 模式：未經 QA／審查流程，只跑冒煙測試（npm test + lint）。

## 做了什麼

1. **建小型 Node API**：Express 4（CommonJS），`src/api/users.js`（GET 列表 / GET by id / POST）、
   `src/services/userService.js`（驗證 + 記憶體資料 + 自訂錯誤）、`tests/users.test.js`（Jest + supertest，5 個測試）、
   ESLint 9 flat config。`package.json` 有 `test`／`lint`。所有套件裝在專案 `node_modules`。
   沒有用 TypeScript，所以不需要釘 `typescript@5`。
2. **等同 /init**：先把原 `CLAUDE.md`（「本專案例外」段落）另存，刪掉原檔，再用
   `claude -p --setting-sources project,local` 請它分析專案並寫 CLAUDE.md。產出 56 行
   （overview／tech stack／指令／架構／慣例），且它自己跑過 `npm test`、`npm run lint` 確認指令可用。
3. **照書上三層結構整理**：
   - 專案根 `CLAUDE.md`：Project overview、Tech stack、Commands、Conventions、Do-not，**60 行**
     （在 50–80 行範圍內，含最後接回的「本專案例外」段落）。
   - `src/api/CLAUDE.md`：API 層專屬規則（檔案/掛載、handler 寫法、HTTP 語意表、測試），32 行。
   - User 層：只寫範本 `templates/user-CLAUDE.md`，**沒有動真正的 `~/.claude/CLAUDE.md`**。
4. **驗證**：`claude -p` 只給「新增 GET /api/health」一句話，不重述慣例；
   逐條對照 19 條規則：18 遵守、1 合理例外、0 違反（詳見 `VERIFY.md`）。

## 驗證結果

- `npm test`：2 suites / 7 tests 通過；`npm run lint`：0 錯誤。
- 兩次 `claude -p` 都加 `--setting-sources project,local` 並先清 `CLAUDE*` 環境變數；子 session 都沒有 commit。

## 和書上做法的差異

| 書上 | 本次 | 原因 |
| --- | --- | --- |
| 互動模式輸入 `/init` | `claude -p` 加上等同 /init 的 prompt | 要全自動、可重現；`-p` 模式不跑互動 slash command |
| /init 產生後再手動編修 | /init 結果先另存（未入版控），再由我重寫為五個區塊 | /init 產出是「架構說明」導向，缺 Do-not 區塊，且長度要控制在 50–80 行 |
| User 層直接編輯 `~/.claude/CLAUDE.md` | 只寫 `templates/user-CLAUDE.md` | 練習限制：不可修改全域檔案 |
| 讓 Claude 寫新功能時自然驗證 | 用 `claude -p` 並排除全域設定 | 全域 Stop hook 會讓子 session 自己 commit |

## 數字說明

- 根目錄 50–80 行：取自本次任務指定的書上建議範圍。
- 其他行數（56／60／32／26）與測試數（5／7）為本次實測值，不是書上數字。

## 踩到的坑

- `claude -p --allowedTools "A,B" "prompt"`：`--allowedTools` 是可變長度參數，會把後面的 prompt 吃掉，
  出現 `Input must be provided either through stdin or as a prompt argument`。改用 stdin（`echo "..." | claude -p ...`）解決。
