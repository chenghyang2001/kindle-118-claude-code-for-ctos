"""PreToolUse hook：.sql 檔只允許寫在專案 migrations/ 底下，否則 exit 2 擋下。"""
import json
import os
import sys
from pathlib import Path


def main():
    try:
        event = json.load(sys.stdin)
    except json.JSONDecodeError as e:
        print(f"guard_sql：無法解析 hook 輸入：{e}", file=sys.stderr)
        return 0  # 解析失敗不擋，避免 hook 自己壞掉卡死所有寫檔

    file_path = (event.get("tool_input") or {}).get("file_path")
    if file_path is None or not file_path.lower().endswith(".sql"):
        return 0

    project = Path(os.environ.get("CLAUDE_PROJECT_DIR") or event.get("cwd") or ".").resolve()
    target = Path(file_path)
    if not target.is_absolute():
        target = Path(event.get("cwd") or project) / target
    target = target.resolve()
    migrations = project / "migrations"

    if target.is_relative_to(migrations):
        return 0
    print(
        f"已阻擋：.sql 檔只能寫在 migrations/ 底下，收到的路徑是 {file_path}。"
        "請改放到 migrations/（例：migrations/002_xxx.sql）。",
        file=sys.stderr,
    )
    return 2


if __name__ == "__main__":
    sys.exit(main())
