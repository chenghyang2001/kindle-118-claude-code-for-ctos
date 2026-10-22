"""計算第 7 章兩個採用指標：子代理對 session 比率、開發者對代理比率。

- 子代理對 session 比率 = SubagentStart 事件數 ÷ 不重複 session 數（健康值 > 2.0，書上數字）
- 開發者對代理比率   = 不重複 session 數 ÷ 「開發者-日」數（目標 > 2.5，書上數字）
  （即每位開發者每個工作日平均驅動幾個代理 session；分母定義見 METRICS.md）
"""
import argparse
import json
import sys
from collections import defaultdict
from dataclasses import dataclass, field
from pathlib import Path

SUBAGENT_HEALTHY = 2.0
DEV_AGENT_TARGET = 2.5
REQUIRED_KEYS = ("ts", "developer", "session_id", "event")


@dataclass
class ParseResult:
    events: list = field(default_factory=list)
    bad_lines: list = field(default_factory=list)  # 壞行的行號（1 起算）


def parse_events(path: Path) -> ParseResult:
    """逐行讀 JSONL；壞行（非 JSON、缺欄位）記下行號後跳過，不中斷整體計算。"""
    result = ParseResult()
    with open(path, encoding="utf-8") as f:
        for lineno, raw in enumerate(f, start=1):
            line = raw.strip()
            if not line:
                continue
            try:
                record = json.loads(line)
            except json.JSONDecodeError:
                result.bad_lines.append(lineno)
                continue
            if not isinstance(record, dict) or any(k not in record for k in REQUIRED_KEYS):
                result.bad_lines.append(lineno)
                continue
            result.events.append(record)
    return result


def _ratio(numerator: int, denominator: int):
    return numerator / denominator if denominator else None


def compute_metrics(events: list) -> dict:
    """回傳整體與每位開發者的兩個比率。分母為 0 時比率為 None。"""
    sessions = defaultdict(set)      # developer -> session_id
    subagents = defaultdict(int)     # developer -> SubagentStart 數
    dev_days = defaultdict(set)      # developer -> 有開 session 的日期
    for e in events:
        dev = e["developer"]
        if e["event"] == "SessionStart":
            sessions[dev].add(e["session_id"])
            dev_days[dev].add(str(e["ts"])[:10])
        elif e["event"] == "SubagentStart":
            subagents[dev] += 1

    per_dev = {}
    for dev in sorted(set(sessions) | set(subagents)):
        n_sess, n_days = len(sessions[dev]), len(dev_days[dev])
        per_dev[dev] = {
            "sessions": n_sess,
            "subagents": subagents[dev],
            "dev_days": n_days,
            "subagent_per_session": _ratio(subagents[dev], n_sess),
            "agents_per_dev_day": _ratio(n_sess, n_days),
        }

    total_sess = sum(len(s) for s in sessions.values())
    total_sub = sum(subagents.values())
    total_days = sum(len(d) for d in dev_days.values())
    overall = {
        "developers": len(per_dev),
        "sessions": total_sess,
        "subagents": total_sub,
        "dev_days": total_days,
        "subagent_per_session": _ratio(total_sub, total_sess),
        "agents_per_dev_day": _ratio(total_sess, total_days),
    }
    return {"overall": overall, "per_developer": per_dev}


def _fmt(value, threshold):
    if value is None:
        return "  N/A  "
    mark = "✓" if value > threshold else "✗"
    return f"{value:5.2f} {mark}"


def format_table(metrics: dict) -> str:
    """輸出 markdown 表格，✓/✗ 表示是否超過門檻。"""
    rows = [
        "| 開發者 | session | 子代理 | 開發者-日 | 子代理/session (>2.0) | 代理/開發者-日 (>2.5) |",
        "|---|---:|---:|---:|---:|---:|",
    ]
    for dev, m in metrics["per_developer"].items():
        rows.append(
            f"| {dev} | {m['sessions']} | {m['subagents']} | {m['dev_days']} | "
            f"{_fmt(m['subagent_per_session'], SUBAGENT_HEALTHY)} | "
            f"{_fmt(m['agents_per_dev_day'], DEV_AGENT_TARGET)} |"
        )
    o = metrics["overall"]
    rows.append(
        f"| **全團隊（{o['developers']} 人）** | {o['sessions']} | {o['subagents']} | {o['dev_days']} | "
        f"{_fmt(o['subagent_per_session'], SUBAGENT_HEALTHY)} | "
        f"{_fmt(o['agents_per_dev_day'], DEV_AGENT_TARGET)} |"
    )
    return "\n".join(rows)


def main(argv=None) -> int:
    parser = argparse.ArgumentParser(description="計算子代理/session 與開發者/代理比率")
    parser.add_argument("input", nargs="?", default="events.jsonl", help="事件 JSONL 路徑")
    args = parser.parse_args(argv)
    path = Path(args.input)
    try:
        parsed = parse_events(path)
    except FileNotFoundError:
        print(f"錯誤：找不到檔案 {path}", file=sys.stderr)
        return 1
    except (OSError, UnicodeDecodeError) as e:
        print(f"錯誤：無法讀取 {path}：{e}", file=sys.stderr)
        return 1

    if parsed.bad_lines:
        print(f"警告：略過 {len(parsed.bad_lines)} 行壞資料（行號 {parsed.bad_lines}）", file=sys.stderr)
    if not parsed.events:
        print("無有效事件，無法計算比率。")
        return 0
    print(format_table(compute_metrics(parsed.events)))
    return 0


if __name__ == "__main__":
    sys.exit(main())
