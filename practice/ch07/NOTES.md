# NOTES.md — 第 7 章演練紀錄

快速 demo 模式，未經 QA／code review。

## 做了什麼

| 檔案 | 用途 |
| --- | --- |
| `METRICS.md` | 兩個指標的定義、計算方式、健康值，以及指標生命週期檢查表（上線、檢視、廢除條件、廢除後） |
| `gen_events.py` | 產生假事件 JSONL：4 位開發者 × 5 天，含 SessionStart／SubagentStart／Stop，另插 2 行壞資料；固定 seed 可重現 |
| `metrics.py` | 讀 JSONL，壞行跳過並警告，算出每人與全團隊的兩個比率，輸出 markdown 表格 |
| `test_metrics.py` | pytest：正常、空檔案、壞行，外加找不到檔案 |
| `telemetry-hook.example.json` | 把 SessionStart／SubagentStart／Stop 用 `jq` + `curl` POST 到 `http://localhost:8787/telemetry` 的範本 |
| `requirements-dev.txt` | pytest（以 `uv pip install` 裝進專案 `.venv`） |

## 驗證結果

```
uv venv .venv && uv pip install --python .venv -r requirements-dev.txt
python gen_events.py        → 已產生 199 筆事件（另含 2 行壞資料）
python metrics.py events.jsonl
python -m pytest -q         → 4 passed
```

`metrics.py` 輸出（seed 42）：

| 開發者 | session | 子代理 | 開發者-日 | 子代理/session (>2.0) | 代理/開發者-日 (>2.5) |
| --- | ---: | ---: | ---: | ---: | ---: |
| alice | 19 | 56 | 5 | 2.95 ✓ | 3.80 ✓ |
| bob | 10 | 7 | 5 | 0.70 ✗ | 2.00 ✗ |
| carol | 17 | 31 | 5 | 1.82 ✗ | 3.40 ✓ |
| dave | 6 | 1 | 5 | 0.17 ✗ | 1.20 ✗ |
| **全團隊（4 人）** | 52 | 95 | 20 | 1.83 ✗ | 2.60 ✓ |

- 壞行（第 8、15 行）有被略過並在 stderr 警告。
- hook 範本：JSON 格式驗證通過；`jq` 過濾式用假 stdin 實測，能產生正確事件 JSON。**沒有**實際送出 POST，也沒有寫入 `.claude/settings.local.json`。

## 和書上做法的差異

1. **只寫範本、不啟用**：書上把遙測接上真正的內部 API／託管設定；這裡只寫 `telemetry-hook.example.json`，URL 用 localhost，要啟用需手動合併進專案層 `.claude/settings.local.json`。
2. **假資料取代真實遙測**：開發者分布、session 數、子代理數都是假設值。
3. **「開發者對代理比率」的分母**：書上原文不在本機無法逐字核對；本演練用「開發者-日」當分母，讓數字能跨週比較。只有 >2.0、>2.5 兩個門檻是書上數字，生命週期檢查表裡的週數、百分比都標了「假設值」。
4. **不用 Console／全域設定**：沒有動 `~/.claude/`，沒有設 `ANTHROPIC_API_KEY`，也沒有用 `claude -p`（本章不需要）。

## 已知沒處理的風險

- `developer` 取自 `USER`／`USERNAME` 環境變數，可偽造；正式環境應改用 SSO 身分。
- hook 依賴 `jq` 與 `curl`，Windows 機器上不一定有。
- 同一 session 跨午夜時，開發者-日只算開始那天。
