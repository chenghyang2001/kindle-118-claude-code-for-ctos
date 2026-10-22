"""metrics.py 的 pytest：正常、空檔案、壞行三種情境。"""
import json

import pytest

from metrics import compute_metrics, main, parse_events


def _write(tmp_path, lines):
    p = tmp_path / "events.jsonl"
    p.write_text("\n".join(lines) + "\n", encoding="utf-8")
    return p


def _ev(dev, sid, event, ts="2026-10-01T09:00:00+00:00"):
    return json.dumps({"ts": ts, "developer": dev, "session_id": sid, "event": event})


def test_normal_ratios(tmp_path):
    # alice：1 天 3 個 session、共 9 個子代理 → 3.0 / 3.0
    # bob：2 天 2 個 session、共 1 個子代理 → 0.5 / 1.0
    lines = []
    for sid in ("a1", "a2", "a3"):
        lines.append(_ev("alice", sid, "SessionStart"))
        lines += [_ev("alice", sid, "SubagentStart")] * 3
        lines.append(_ev("alice", sid, "Stop"))
    lines.append(_ev("bob", "b1", "SessionStart", "2026-10-01T10:00:00+00:00"))
    lines.append(_ev("bob", "b1", "SubagentStart", "2026-10-01T10:05:00+00:00"))
    lines.append(_ev("bob", "b2", "SessionStart", "2026-10-02T10:00:00+00:00"))
    m = compute_metrics(parse_events(_write(tmp_path, lines)).events)

    assert m["per_developer"]["alice"]["subagent_per_session"] == pytest.approx(3.0)
    assert m["per_developer"]["alice"]["agents_per_dev_day"] == pytest.approx(3.0)
    assert m["per_developer"]["bob"]["subagent_per_session"] == pytest.approx(0.5)
    assert m["per_developer"]["bob"]["agents_per_dev_day"] == pytest.approx(1.0)
    # 全團隊：10 子代理 / 5 session = 2.0；5 session / 3 開發者-日
    assert m["overall"]["subagent_per_session"] == pytest.approx(2.0)
    assert m["overall"]["agents_per_dev_day"] == pytest.approx(5 / 3)


def test_empty_file(tmp_path, capsys):
    p = tmp_path / "empty.jsonl"
    p.write_text("", encoding="utf-8")
    parsed = parse_events(p)
    assert parsed.events == [] and parsed.bad_lines == []
    m = compute_metrics([])
    assert m["overall"]["subagent_per_session"] is None
    assert m["overall"]["agents_per_dev_day"] is None
    assert main([str(p)]) == 0
    assert "無有效事件" in capsys.readouterr().out


def test_bad_lines_skipped(tmp_path, capsys):
    lines = [
        _ev("alice", "a1", "SessionStart"),
        '{"ts": "broken", "event": ',            # 截斷的 JSON
        "not json at all",
        json.dumps({"event": "SessionStart"}),   # 缺欄位
        json.dumps([1, 2, 3]),                   # 不是物件
        _ev("alice", "a1", "SubagentStart"),
    ]
    p = _write(tmp_path, lines)
    parsed = parse_events(p)
    assert parsed.bad_lines == [2, 3, 4, 5]
    assert len(parsed.events) == 2
    assert main([str(p)]) == 0
    captured = capsys.readouterr()
    assert "略過 4 行壞資料" in captured.err
    assert "alice" in captured.out


def test_missing_file_returns_error(tmp_path):
    assert main([str(tmp_path / "nope.jsonl")]) == 1
