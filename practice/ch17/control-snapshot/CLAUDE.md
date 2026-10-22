# 生態系 CLAUDE.md（多儲存庫控制區）

`work/` 是三個獨立 git repo 的**父目錄，本身不是 repo**。本檔是跨 repo（spanning）session 的共同簡報。

## 佈局（平坦同級）

```
work/
├── .claude/              ← 控制區（本檔、modules/、settings.local.json）
├── shared-contracts/     ← 獨立 git repo
├── backend/              ← 獨立 git repo
└── frontend/             ← 獨立 git repo
```

## 各 repo 角色

| repo | 角色 | 技術 | 依賴 |
| --- | --- | --- | --- |
| `shared-contracts` | 契約層：OpenAPI 規格 + JSDoc 型別 + 驗證函式；**單一事實來源** | 純 JS | 無 |
| `backend` | billing API（`GET /invoices/:id`） | Node `node:http`，零依賴 | `shared-contracts` |
| `frontend` | Node 命令列用戶端，呼叫 backend 並驗證回應 | Node 原生 fetch | `shared-contracts`、執行期呼叫 `backend` |

## 依賴方向（只能往下指，禁止反向）

```
frontend ──▶ backend ──▶ shared-contracts
    └──────────────────────▶ shared-contracts
```

- `shared-contracts` 不可 import backend 或 frontend 的任何東西。
- `backend` 不可 import frontend。
- 型別只定義在 `shared-contracts`；backend / frontend 不可各自複製一份型別。

## 部署順序規則（硬規則）

**shared-contracts → backend → frontend**

1. 先發佈 `shared-contracts`（契約新版本）
2. 再部署 `backend`（開始產出新契約格式，且需向後相容舊用戶端）
3. 最後部署 `frontend`（開始消費新欄位）

理由：消費端永遠晚於提供端上線，才不會出現「frontend 讀不到欄位」或「backend 引用不存在的型別」。
破壞性變更（刪欄位、改型別）要拆兩階段：先新增並雙寫，等 frontend 換完再移除舊欄位。

## 跨 repo 工作規則

- 一個變更跨多個 repo 時，**每個 repo 各自 commit**，commit 訊息引用同一個變更代號。
- 動到 `shared-contracts` 前先查 `modules/` 對應模組文件，確認所有消費端檔案。
- 模組文件：`modules/billing.md`（billing 跨 repo 檔案位置）。
