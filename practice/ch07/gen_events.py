"""產生假的 Claude Code session 事件 JSONL，供 metrics.py 計算比率用。

每行一個事件：
{"ts": ISO8601, "developer": str, "session_id": str, "event": "SessionStart"|"SubagentStart"|"Stop"}
"""
import argparse
import json
import random
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

# 開發者名單與「每日 session 數、每 session 子代理數」的分布皆為假設值，僅供演練
DEVELOPERS = {
    "alice": {"sessions_per_day": (2, 4), "subagents_per_session": (2, 5)},
    "bob": {"sessions_per_day": (1, 3), "subagents_per_session": (0, 2)},
    "carol": {"sessions_per_day": (3, 5), "subagents_per_session": (1, 4)},
    "dave": {"sessions_per_day": (1, 2), "subagents_per_session": (0, 1)},
}


def generate_events(days: int, seed: int) -> list[dict]:
    """依設定產生事件清單（固定 seed 讓結果可重現）。"""
    rng = random.Random(seed)
    start = datetime(2026, 10, 1, 9, 0, tzinfo=timezone.utc)
    events = []
    counter = 0
    for day in range(days):
        day_start = start + timedelta(days=day)
        for dev, profile in DEVELOPERS.items():
            for _ in range(rng.randint(*profile["sessions_per_day"])):
                counter += 1
                session_id = f"s{counter:04d}"
                t = day_start + timedelta(minutes=rng.randint(0, 480))
                events.append(_event(t, dev, session_id, "SessionStart"))
                for _ in range(rng.randint(*profile["subagents_per_session"])):
                    t += timedelta(minutes=rng.randint(1, 15))
                    events.append(_event(t, dev, session_id, "SubagentStart"))
                t += timedelta(minutes=rng.randint(5, 60))
                events.append(_event(t, dev, session_id, "Stop"))
    events.sort(key=lambda e: e["ts"])
    return events


def _event(ts: datetime, developer: str, session_id: str, event: str) -> dict:
    return {"ts": ts.isoformat(), "developer": developer, "session_id": session_id, "event": event}


def main() -> None:
    parser = argparse.ArgumentParser(description="產生假 session 事件 JSONL")
    parser.add_argument("--out", default="events.jsonl", help="輸出檔路徑")
    parser.add_argument("--days", type=int, default=5, help="模擬天數")
    parser.add_argument("--seed", type=int, default=42, help="亂數種子")
    parser.add_argument("--bad-lines", type=int, default=2, help="故意插入的壞行數（測試容錯）")
    args = parser.parse_args()
    if args.days < 1:
        print("錯誤：--days 至少為 1", file=sys.stderr)
        sys.exit(1)
    events = generate_events(args.days, args.seed)
    lines = [json.dumps(e, ensure_ascii=False) for e in events]
    # 模擬遙測管線偶發的截斷／亂碼行
    for i in range(args.bad_lines):
        lines.insert(min(len(lines), (i + 1) * 7), '{"ts": "broken", "event": ')
    try:
        Path(args.out).write_text("\n".join(lines) + "\n", encoding="utf-8")
    except OSError as e:
        print(f"錯誤：無法寫入 {args.out}：{e}", file=sys.stderr)
        sys.exit(1)
    print(f"已產生 {len(events)} 筆事件（另含 {args.bad_lines} 行壞資料）→ {args.out}")


if __name__ == "__main__":
    main()
