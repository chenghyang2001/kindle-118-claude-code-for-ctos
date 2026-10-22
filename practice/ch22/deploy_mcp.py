"""內部部署工具 MCP server（K118 第 22 章演練，stdio 傳輸）。

提供：
- tool  list_deployments：依服務名稱查詢最近 N 筆部署紀錄（唯讀）
- tool  confirm_deployment：把某次部署標記為已確認（冪等）
- resource deploy://services/status：列出每個服務最新一次部署的狀態

每次 tool 呼叫都寫一行 JSON 到 logs/audit.jsonl（成功、失敗、被限流都記）。
核心邏輯寫成純函式（吃路徑參數），方便 pytest 用暫存目錄測試。
"""
from __future__ import annotations

import json
import os
import sys
import time
from collections import deque
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

BASE_DIR = Path(__file__).resolve().parent
DATA_FILE = Path(os.environ.get("DEPLOY_MCP_DATA", BASE_DIR / "data" / "deployments.json"))
AUDIT_FILE = Path(os.environ.get("DEPLOY_MCP_AUDIT", BASE_DIR / "logs" / "audit.jsonl"))

MAX_LIMIT = 50
# 速率限制：每 60 秒最多 30 次 tool 呼叫（書上要求要有 rate limit，數字是假設值）
RATE_LIMIT_CALLS = 30
RATE_LIMIT_WINDOW = 60.0


class DeployError(ValueError):
    """給呼叫端看的錯誤（輸入不合法、找不到紀錄、被限流）。"""


# ---------- 資料存取 ----------
def load_deployments(data_file: Path) -> list[dict[str, Any]]:
    try:
        payload = json.loads(Path(data_file).read_text(encoding="utf-8"))
    except FileNotFoundError as exc:
        raise DeployError(f"找不到部署資料檔：{data_file}") from exc
    except json.JSONDecodeError as exc:
        raise DeployError(f"部署資料檔 JSON 格式錯誤：{exc}") from exc
    records = payload.get("deployments")
    if not isinstance(records, list):
        raise DeployError("部署資料檔缺少 deployments 陣列")
    return records


def save_deployments(data_file: Path, records: list[dict[str, Any]]) -> None:
    # 先寫暫存檔再取代，避免寫到一半中斷把資料檔弄壞
    data_file = Path(data_file)
    tmp = data_file.with_suffix(".json.tmp")
    tmp.write_text(json.dumps({"deployments": records}, ensure_ascii=False, indent=2), encoding="utf-8")
    os.replace(tmp, data_file)


def write_audit(audit_file: Path, tool: str, args: dict[str, Any], outcome: str, detail: str = "") -> None:
    audit_file = Path(audit_file)
    audit_file.parent.mkdir(parents=True, exist_ok=True)
    entry = {
        "ts": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "tool": tool,
        "args": args,
        "outcome": outcome,
        "detail": detail,
    }
    with audit_file.open("a", encoding="utf-8") as fh:
        fh.write(json.dumps(entry, ensure_ascii=False) + "\n")


# ---------- 核心邏輯 ----------
def query_deployments(records: list[dict[str, Any]], service: str, limit: int = 5) -> list[dict[str, Any]]:
    service = (service or "").strip()
    if not service:
        raise DeployError("service 不可為空")
    if not isinstance(limit, int) or limit < 1 or limit > MAX_LIMIT:
        raise DeployError(f"limit 必須是 1～{MAX_LIMIT} 的整數")
    matched = [r for r in records if r.get("service") == service]
    matched.sort(key=lambda r: r.get("deployed_at", ""), reverse=True)
    return matched[:limit]


def confirm(records: list[dict[str, Any]], deployment_id: str, confirmed_by: str,
            now: str | None = None) -> tuple[dict[str, Any], bool]:
    """回傳 (紀錄, 這次是否有變更)。已確認過就原樣回傳，保留第一次的確認者與時間。"""
    deployment_id = (deployment_id or "").strip()
    confirmed_by = (confirmed_by or "").strip()
    if not deployment_id:
        raise DeployError("deployment_id 不可為空")
    if not confirmed_by:
        raise DeployError("confirmed_by 不可為空")
    for rec in records:
        if rec.get("id") == deployment_id:
            if rec.get("confirmed"):
                return rec, False
            rec["confirmed"] = True
            rec["confirmed_by"] = confirmed_by
            rec["confirmed_at"] = now or datetime.now(timezone.utc).isoformat(timespec="seconds")
            return rec, True
    raise DeployError(f"找不到部署紀錄：{deployment_id}")


def service_status(records: list[dict[str, Any]]) -> list[dict[str, Any]]:
    latest: dict[str, dict[str, Any]] = {}
    for rec in records:
        svc = rec.get("service")
        if svc and (svc not in latest or rec.get("deployed_at", "") > latest[svc].get("deployed_at", "")):
            latest[svc] = rec
    return [
        {"service": svc, "version": r.get("version"), "status": r.get("status"),
         "deployed_at": r.get("deployed_at"), "confirmed": bool(r.get("confirmed"))}
        for svc, r in sorted(latest.items())
    ]


class RateLimiter:
    """滑動視窗限流器。clock 可注入，方便測試。"""

    def __init__(self, max_calls: int, window: float, clock=time.monotonic):
        self.max_calls, self.window, self.clock = max_calls, window, clock
        self.calls: deque[float] = deque()

    def check(self) -> None:
        now = self.clock()
        while self.calls and now - self.calls[0] >= self.window:
            self.calls.popleft()
        if len(self.calls) >= self.max_calls:
            raise DeployError(f"呼叫太頻繁：每 {int(self.window)} 秒最多 {self.max_calls} 次")
        self.calls.append(now)


# ---------- MCP 介面 ----------
def build_server():
    from mcp.server.mcpserver import MCPServer  # mcp 2.x：FastMCP 已改名 MCPServer

    server = MCPServer("deploy-mcp", instructions="查詢假部署紀錄、確認部署、看服務狀態的內部工具。")
    limiter = RateLimiter(RATE_LIMIT_CALLS, RATE_LIMIT_WINDOW)

    def audited(tool: str, args: dict[str, Any], fn):
        try:
            limiter.check()
            result, detail = fn()
        except DeployError as exc:
            write_audit(AUDIT_FILE, tool, args, "error", str(exc))
            raise
        write_audit(AUDIT_FILE, tool, args, "ok", detail)
        return result

    @server.tool(description="依服務名稱查詢最近 limit 筆部署紀錄（新到舊，唯讀）。")
    def list_deployments(service: str, limit: int = 5) -> list[dict[str, Any]]:
        def run():
            rows = query_deployments(load_deployments(DATA_FILE), service, limit)
            return rows, f"{len(rows)} 筆"
        return audited("list_deployments", {"service": service, "limit": limit}, run)

    @server.tool(description="把某次部署標記為已確認。冪等：重複呼叫回傳相同結果，不覆蓋第一次的確認者與時間。")
    def confirm_deployment(deployment_id: str, confirmed_by: str) -> dict[str, Any]:
        def run():
            records = load_deployments(DATA_FILE)
            rec, changed = confirm(records, deployment_id, confirmed_by)
            if changed:
                save_deployments(DATA_FILE, records)
            return rec, "changed" if changed else "already-confirmed（未變更）"
        return audited("confirm_deployment", {"deployment_id": deployment_id, "confirmed_by": confirmed_by}, run)

    @server.resource("deploy://services/status", name="services-status", mime_type="application/json",
                     description="每個服務最新一次部署的版本、狀態、是否已確認。")
    def services_status() -> str:
        return json.dumps(service_status(load_deployments(DATA_FILE)), ensure_ascii=False, indent=2)

    return server


def main() -> None:
    try:
        build_server().run("stdio")
    except KeyboardInterrupt:
        pass
    except Exception as exc:  # 啟動失敗要讓 claude mcp list 看得到原因
        print(f"deploy-mcp 啟動失敗：{exc}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
