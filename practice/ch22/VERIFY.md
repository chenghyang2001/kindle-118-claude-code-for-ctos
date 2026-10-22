# 第 22 章驗證紀錄

日期：2026-10-22　環境：Windows 11、uv 0.12.23、Python .venv、`mcp` 2.3.0、pytest

## 1. 單元測試

```
.venv/Scripts/python.exe -m pytest -q
12 passed in 0.80s
```

涵蓋：查詢排序與筆數、未知服務回空、非法輸入（空服務名、limit=0、limit=51）、確認冪等、找不到 id、服務狀態取最新、存讀檔＋audit 寫入、資料檔不存在／JSON 壞掉、限流器、server 能建立。

## 2. 掛上 Claude Code（專案層）

```
claude mcp add --scope project deploy-mcp -- .venv/Scripts/python.exe deploy_mcp.py
→ 產生 .mcp.json（相對路徑指向 .venv 的 python）
.claude/settings.local.json → {"enabledMcpjsonServers": ["deploy-mcp"]}
claude mcp list → deploy-mcp: .venv/Scripts/python.exe deploy_mcp.py - ✔ Connected
```

## 3. 用 claude -p 實際呼叫

共通：先 unset 所有 `CLAUDE*` 環境變數；加 `--setting-sources project,local`；`--allowedTools` 只放行要用的工具；prompt 從 stdin 傳。

### 3a. 查詢 tool（`mcp__deploy-mcp__list_deployments`，service=billing、limit=3）

| id | version | status | deployed_at | confirmed |
| --- | --- | --- | --- | --- |
| dep-014 | v1.5.0 | succeeded | 2026-10-19T05:30:00Z | false |
| dep-011 | v1.4.0 | failed | 2026-10-18T04:30:00Z | false |
| dep-008 | v1.3.0 | succeeded | 2026-10-17T03:30:00Z | false |

### 3b. 確認 tool 呼叫兩次（`mcp__deploy-mcp__confirm_deployment`，dep-005）

| 欄位 | 第 1 次（confirmed_by=cto-drill） | 第 2 次（confirmed_by=someone-else） | 相同？ |
| --- | --- | --- | --- |
| confirmed_by | cto-drill | cto-drill | ✅ |
| confirmed_at | 2026-10-22T06:26:01+00:00 | 2026-10-22T06:26:01+00:00 | ✅ |

結論：冪等。第二次不改任何狀態，原樣回傳第一次的確認紀錄。子 session 也指出：第二次傳不同確認者時沒有警告，呼叫方要自己比對（列入改進項）。

### 3c. resource（`deploy://services/status`，用 ReadMcpResourceTool）

| 服務 | version | status | confirmed |
| --- | --- | --- | --- |
| api-gateway | v1.5.0 | succeeded | false |
| billing | v1.5.0 | succeeded | false |
| web-frontend | v2.2.0 | rolled_back | false |

註：第一次讀 resource 只出現兩個服務，查出是假資料產生腳本把 web-frontend 全部跳掉了（server 沒錯）；補 3 筆 web-frontend 紀錄後重讀，三個服務都出現。

## 4. audit log（logs/audit.jsonl）

```
{"ts": "2026-10-22T06:25:49+00:00", "tool": "list_deployments", "args": {"service": "billing", "limit": 3}, "outcome": "ok", "detail": "3 筆"}
{"ts": "2026-10-22T06:26:01+00:00", "tool": "confirm_deployment", "args": {"deployment_id": "dep-005", "confirmed_by": "cto-drill"}, "outcome": "ok", "detail": "changed"}
{"ts": "2026-10-22T06:26:03+00:00", "tool": "confirm_deployment", "args": {"deployment_id": "dep-005", "confirmed_by": "someone-else"}, "outcome": "ok", "detail": "already-confirmed（未變更）"}
```

3 次 tool 呼叫 → 3 行；第二次確認明確記為「未變更」。讀 resource 不寫 audit（設計上只記 tool）。

## 結果

| 項目 | 結果 |
| --- | --- |
| pytest | 12/12 通過 |
| 專案層掛載、免確認 | ✅ Connected，claude -p 不需互動核准 |
| 查詢 tool | ✅ |
| 確認 tool 冪等 | ✅ 兩次結果相同 |
| resource | ✅ 三個服務 |
| audit.jsonl | ✅ 3 行 |
