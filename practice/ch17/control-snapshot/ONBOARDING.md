# 新人上手：多儲存庫工作區

## 1. 建立平坦同級佈局

```bash
mkdir work && cd work
git clone <git-host>/<org>/shared-contracts.git   # 範本網址，請換成實際位置
git clone <git-host>/<org>/backend.git
git clone <git-host>/<org>/frontend.git
```

`work/` 本身**不要** `git init`，它只是容器。

## 2. 放入控制區

把團隊的控制區（`CLAUDE.md`、`modules/`、`settings.local.json`）複製到 `work/.claude/`。
在本練習中，控制區的版本化副本放在練習 repo 的 `control-snapshot/`：

```bash
cp -r <練習 repo>/control-snapshot/. work/.claude/
```

## 3. 驗證三個 repo 可以跑

```bash
for r in shared-contracts backend frontend; do (cd "$r" && npm test); done
(cd backend && npm start) &          # 另開終端也可以
(cd frontend && npm start inv-001)   # 應印出「發票 inv-001｜…｜總額 990.00 TWD」
```

## 4. 啟動 spanning session（跨 repo）

**方式 A（推薦）：從 `work/` 開 session**

```bash
cd work
claude
```

Claude 會讀 `work/.claude/CLAUDE.md` 與 `work/.claude/settings.local.json`，三個 repo 都在工作目錄底下。

**方式 B：從單一 repo 開，再加入其他 repo**

```bash
cd work/backend
claude --add-dir ../shared-contracts --add-dir ../frontend
```

注意：方式 B 的工作目錄是 `backend/`，所以讀不到 `work/.claude/` 控制區；要的話在提示中明說「先讀 ../.claude/CLAUDE.md」，或改用方式 A。

## 5. 必讀

- `.claude/CLAUDE.md`：各 repo 角色、依賴方向、部署順序（shared-contracts → backend → frontend）
- `.claude/modules/billing.md`：billing 模組在三個 repo 的檔案位置
- 每個 repo 各自 commit；不要在 `work/` 層級 `git init`
