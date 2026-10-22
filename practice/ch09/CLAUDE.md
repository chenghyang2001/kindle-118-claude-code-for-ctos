
## 本專案例外

本專案是 Kindle 書籍教學 demo（kindle-drill 快速模式），豁免全域「程式碼三 agent 鐵律」：主 Claude 直接寫檔，不派 code-writer／code-qa／code-reviewer；不需詢問複雜度，也不需詢問是否使用快速模式（已選快速模式）。
所有選擇題一律採用推薦選項、不要停下來問使用者；不可修改全域 `~/.claude/settings.json`，設定一律寫在本專案的 `.claude/settings.local.json`。

## 資安規則（K118 第 9 章）

書上的原文規則（照抄，不翻譯，讓模型直接讀到）：

```text
Never read or modify files in /secrets, /credentials, or any .env file.
```

補充規則：

1. 不讀取、不修改、不輸出 `secrets/`、`credentials/`、任何 `.env*` 檔的內容；需要設定值時只參考 `.env.example`。
2. 不執行破壞性指令：`rm -rf`、`git push --force`、`git reset --hard`、`git clean -fdx`、`git branch -D`、`DROP TABLE`。
3. 不把 API key、token、密碼寫進程式碼、log、commit message 或對話。
4. 可以自由執行測試與 lint（`npm test`、`npm run lint`、`uv run pytest`、`ruff check`）。
5. 上面的規則由 `.claude/settings.local.json` 的 `permissions.deny` 在工具層強制執行；CLAUDE.md 只是「提醒」，真正的擋是設定檔。
