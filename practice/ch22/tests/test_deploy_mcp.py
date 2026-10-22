"""deploy_mcp 核心函式測試（不啟動 MCP，直接測純函式）。"""
import json
import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
import deploy_mcp as dm  # noqa: E402


def make_records():
    return [
        {"id": "d1", "service": "api", "status": "succeeded", "version": "v1", "deployed_at": "2026-10-01T00:00:00Z", "confirmed": False},
        {"id": "d2", "service": "api", "status": "failed", "version": "v2", "deployed_at": "2026-10-03T00:00:00Z", "confirmed": False},
        {"id": "d3", "service": "web", "status": "succeeded", "version": "v9", "deployed_at": "2026-10-02T00:00:00Z", "confirmed": True,
         "confirmed_by": "x", "confirmed_at": "2026-10-02T01:00:00Z"},
    ]


def test_query_sorted_and_limited():
    rows = dm.query_deployments(make_records(), "api", 1)
    assert [r["id"] for r in rows] == ["d2"]


def test_query_unknown_service_returns_empty():
    assert dm.query_deployments(make_records(), "nope", 5) == []


@pytest.mark.parametrize("service,limit", [("", 5), ("api", 0), ("api", 51)])
def test_query_invalid_input(service, limit):
    with pytest.raises(dm.DeployError):
        dm.query_deployments(make_records(), service, limit)


def test_confirm_is_idempotent():
    records = make_records()
    first, changed1 = dm.confirm(records, "d1", "alice", now="T1")
    snapshot = dict(first)
    second, changed2 = dm.confirm(records, "d1", "bob", now="T2")
    assert changed1 is True and changed2 is False
    assert second == snapshot and second["confirmed_by"] == "alice" and second["confirmed_at"] == "T1"


def test_confirm_missing_id():
    with pytest.raises(dm.DeployError):
        dm.confirm(make_records(), "zzz", "alice")


def test_service_status_latest_per_service():
    status = {s["service"]: s for s in dm.service_status(make_records())}
    assert status["api"]["version"] == "v2" and status["api"]["status"] == "failed"
    assert status["web"]["confirmed"] is True


def test_save_load_and_audit(tmp_path):
    data = tmp_path / "d.json"
    dm.save_deployments(data, make_records())
    assert len(dm.load_deployments(data)) == 3
    audit = tmp_path / "logs" / "a.jsonl"
    dm.write_audit(audit, "list_deployments", {"service": "api"}, "ok", "2 筆")
    dm.write_audit(audit, "confirm_deployment", {"deployment_id": "d1"}, "error", "x")
    lines = [json.loads(x) for x in audit.read_text(encoding="utf-8").splitlines()]
    assert [x["tool"] for x in lines] == ["list_deployments", "confirm_deployment"]


def test_load_errors(tmp_path):
    with pytest.raises(dm.DeployError):
        dm.load_deployments(tmp_path / "missing.json")
    bad = tmp_path / "bad.json"
    bad.write_text("{oops", encoding="utf-8")
    with pytest.raises(dm.DeployError):
        dm.load_deployments(bad)


def test_rate_limiter():
    t = [0.0]
    rl = dm.RateLimiter(2, 10, clock=lambda: t[0])
    rl.check(); rl.check()
    with pytest.raises(dm.DeployError):
        rl.check()
    t[0] = 10.0
    rl.check()


def test_build_server_registers_tools():
    pytest.importorskip("mcp")
    assert dm.build_server() is not None
