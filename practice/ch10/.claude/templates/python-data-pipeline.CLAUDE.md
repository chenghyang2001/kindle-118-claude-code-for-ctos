# CLAUDE.md 範本：Python 資料管道

> 複製到專案根目錄改名為 `CLAUDE.md`，把 `＿＿＿` 換成實際值，刪掉不適用的條目。

## 專案概述

＿＿＿（一句話：從哪裡取資料、轉成什麼、送去哪裡、多久跑一次）

## 技術堆疊

- Python 3.＿＿，套件用 uv 管理（`.venv`）
- 處理：pandas ／ polars；排程：Airflow ／ Prefect ／ cron
- 驗證：pydantic ／ pandera（資料 schema）
- 測試：pytest；Lint：ruff

## 常用指令

- 安裝：`uv sync`
- 測試：`uv run pytest`
- Lint：`uv run ruff check .`
- 本機跑一次：`uv run python -m pipeline.run --date YYYY-MM-DD --dry-run`

## 目錄結構

- `pipeline/extract/`、`pipeline/transform/`、`pipeline/load/`
- `tests/fixtures/` 小型樣本資料（不放真實個資）

## 規則

- 轉換函式寫成純函式（DataFrame 進、DataFrame 出），方便測試。
- 每個步驟可重跑（idempotent）：同一天跑兩次結果相同、不重複寫入。
- 所有寫入正式資料庫的動作必須有 `--dry-run`；預設不寫入正式環境。
- 讀寫檔案一律 `encoding="utf-8"`；路徑用 `pathlib`，不硬編碼使用者目錄。
- 不要把真實資料或連線字串貼進對話或寫進程式碼。

## 完成定義

`uv run pytest`、`uv run ruff check .` 通過，新步驟有 fixture 測試。
