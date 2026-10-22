"""PostToolUse hook：每次 Write/Edit 成功後，追加一行紀錄到 .claude/hook.log。"""
import json
import os
import sys
from datetime import datetime
from pathlib import Path


def main():
    try:
        event = json.load(sys.stdin)
    except json.JSONDecodeError as e:
        print(f"log_write：無法解析 hook 輸入：{e}", file=sys.stderr)
        return 0
    project = Path(os.environ.get("CLAUDE_PROJECT_DIR") or event.get("cwd") or ".")
    tool = event.get("tool_name", "?")
    file_path = (event.get("tool_input") or {}).get("file_path", "?")
    line = f"{datetime.now().isoformat(timespec='seconds')}\t{tool}\t{file_path}\n"
    try:
        with open(project / ".claude" / "hook.log", "a", encoding="utf-8") as f:
            f.write(line)
    except OSError as e:
        print(f"log_write：寫 log 失敗：{e}", file=sys.stderr)
    return 0


if __name__ == "__main__":
    sys.exit(main())
