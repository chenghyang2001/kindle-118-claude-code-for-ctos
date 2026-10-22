# NOTES：K118 第 9 章「資安合規與治理」快速演練

> 快速 demo 模式：主 Claude 直接寫檔，未經 code-qa／code-reviewer 審查。

## 做了什麼

1. **專案層權限設定** `.claude/settings.local.json`：
   - deny：`Read/Edit/Write` 對 `secrets/**`、`credentials/**`、`.env*`；Bash `cat` 機密檔；破壞性指令 `rm -rf`／`rm -fr`／`rm -r`、`git push --force`／`-f`／`--force-with-lease`、`git reset --hard`、`git clean -fd(x)`、`git branch -D`、`chmod -R 777`、`curl | sh`。
   - allow：`npm test`、`npm run lint`、`npx eslint`、`npx tsc --noEmit`、`uv run pytest`、`ruff check`、`git status/diff/log`。
2. **CLAUDE.md** 加上書上原文規則 `Never read or modify files in /secrets, /credentials, or any .env file.` 與 5 條補充。
3. **假機密檔**：`.env`（`FAKE_KEY=not-a-real-secret`）、`secrets/fake.txt`、`credentials/fake.json`，以及 rm -rf 的犧牲目錄 `sandbox-target/`。
4. **用 `claude -p` 實測 9 項**，記錄在 `VERIFY.md`，原始 stream-json 在 `verify-logs/`。
5. **託管設定範本** `managed-settings.example.json`（只寫範本，沒有放到系統路徑）。
6. **`CISO-SUMMARY.md`**（資料流向、留存、合規、三層控制、剩餘風險）與 **`SECURITY-SPEND-CHECKLIST.md`**。

## 驗證結果

| 測試 | 結果 |
| --- | --- |
| Read `.env`／`secrets/fake.txt` | 擋下：`File is in a directory that is denied by your permission settings.` |
| Bash `rm -rf sandbox-target` | 擋下：`Permission to use Bash with command rm -rf sandbox-target has been denied.`；目錄仍在 |
| 同上兩項改用 `bypassPermissions` | 仍然擋下 → deny 優先於權限模式 |
| `git push --force`、`cat secrets/fake.txt` | 擋下 |
| `git status`（allow） | 正常放行 |
| 對照組：不載入 local 設定 | `.env` 被讀出 → 證明是 deny 在擋，CLAUDE.md 規則單獨擋不住 |

## 和書上做法的差異

| 項目 | 書上 | 本演練 |
| --- | --- | --- |
| 設定檔位置 | `.claude/settings.json` 或 IT 託管設定 | `.claude/settings.local.json`（專案 CLAUDE.md 規定）；託管設定只寫範本 |
| 託管設定派發 | 企業 MDM／組態管理系統 | 不派發，`managed-settings.example.json` 註明三平台路徑 |
| `--permission-mode` | 用來控制嚴格度 | 用 `default` 與 `bypassPermissions` 兩種實測，證明 deny 在兩種模式都有效 |
| 支出上限與警示 | Console 設每人每日上限＋Alert | 需要 Console 帳號，只寫在檢查表；金額全是假設值 |
| 合規證明 | SOC 2 Type II、HIPAA/BAA、ZDR 文件 | 只在 CISO 摘要列出要索取哪些文件 |
| 驗證方式 | 書上沒寫怎麼驗 | 加了 `--allowedTools` 放行＋對照組，確認擋的是 deny 而不是 -p 預設拒絕 |

假設值：每人每日 US$20、警示 50%／80%、工作區每月 US$2,000、週預算超 20%、異常 3 倍、金鑰 90 天輪替、OTel 端點網址。書上提到要設上限和閥值，但沒給數字。

## 已知風險

- Bash deny 是字串比對，`head .env`、`python -c "open('.env')..."` 這類換寫法沒擋（沒實測，避免真的讀出）。
- 假機密檔與含 `FAKE_KEY` 的對照組 log 有 commit 進版控（內容是假的，教材用途）；正式專案應 `.gitignore` 掉 `.env` 與 `secrets/`。
- `git reset --hard` 有列在 deny，但沒實測（工作目錄當時有未 commit 的檔案，避免真的被清掉）。
