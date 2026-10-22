"""彙整三個 claude -p 審查結果 → REVIEW-REPORT.md（依嚴重度排序、去重）。

用法：
    python aggregate.py <raw_dir> <output_md>

raw_dir 內預期有 correctness.raw.json / security.raw.json / conventions.raw.json，
每個是 `claude -p --output-format json` 的原始輸出（外層 {"result": "..."}）。
本腳本也會把解析後的 findings 另存為 <dimension>.json，方便 CI 上傳 artifact。

去重規則：同檔案 + 同 tag + 行號相差 ≤ 2 視為同一問題；
保留最高嚴重度，並記錄是哪幾個面向都抓到（交叉確認＝更可信）。
"""
import json
import sys
from pathlib import Path

DIMENSIONS = ["correctness", "security", "conventions"]
DIMENSION_LABEL = {"correctness": "正確性", "security": "資安", "conventions": "規範"}
SEVERITY_ORDER = {"critical": 0, "high": 1, "medium": 2, "low": 3}
SEVERITY_LABEL = {"critical": "🔴 Critical", "high": "🟠 High", "medium": "🟡 Medium", "low": "🔵 Low"}
LINE_TOLERANCE = 2


def extract_json_object(text: str) -> dict:
    """模型偶爾會包 ```json 圍欄或前後加字，取第一個 { 到最後一個 } 再解析。"""
    start, end = text.find("{"), text.rfind("}")
    if start == -1 or end <= start:
        raise ValueError("找不到 JSON 物件")
    return json.loads(text[start:end + 1])


def load_findings(raw_dir: Path, dimension: str) -> tuple[list, str | None]:
    """回傳 (findings, 錯誤訊息)；單一面向失敗不讓整份報告失敗。"""
    raw_path = raw_dir / f"{dimension}.raw.json"
    try:
        outer = json.loads(raw_path.read_text(encoding="utf-8"))
        if outer.get("is_error"):
            return [], f"claude 回報錯誤：{outer.get('result', '')[:200]}"
        payload = extract_json_object(outer.get("result", ""))
    except FileNotFoundError:
        return [], f"找不到 {raw_path.name}"
    except (json.JSONDecodeError, ValueError) as exc:
        return [], f"解析失敗：{exc}"

    findings = []
    for item in payload.get("findings", []):
        if not isinstance(item, dict):
            continue
        severity = str(item.get("severity", "low")).lower()
        item["severity"] = severity if severity in SEVERITY_ORDER else "low"
        try:
            item["line"] = int(item.get("line") or 0)
        except (TypeError, ValueError):
            item["line"] = 0
        item["sources"] = [dimension]
        findings.append(item)
    (raw_dir / f"{dimension}.json").write_text(
        json.dumps(findings, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    return findings, None


def is_duplicate(a: dict, b: dict) -> bool:
    return (
        a.get("file") == b.get("file")
        and a.get("tag") == b.get("tag")
        and abs(a["line"] - b["line"]) <= LINE_TOLERANCE
    )


def merge_findings(all_findings: list) -> list:
    merged: list = []
    for finding in all_findings:
        twin = next((m for m in merged if is_duplicate(m, finding)), None)
        if twin is None:
            merged.append(dict(finding))
            continue
        for src in finding["sources"]:
            if src not in twin["sources"]:
                twin["sources"].append(src)
        if SEVERITY_ORDER[finding["severity"]] < SEVERITY_ORDER[twin["severity"]]:
            # 保留較嚴重那筆的描述，但來源要合併
            sources = twin["sources"]
            twin.update(finding)
            twin["sources"] = sources
    merged.sort(key=lambda f: (SEVERITY_ORDER[f["severity"]], -len(f["sources"]), f.get("file", ""), f["line"]))
    return merged


def render_report(merged: list, raw_counts: dict, errors: dict) -> str:
    lines = ["# Claude PR 審查報告", ""]
    counts = {s: sum(1 for f in merged if f["severity"] == s) for s in SEVERITY_ORDER}
    total_raw = sum(raw_counts.values())
    lines.append(
        f"去重後 **{len(merged)}** 項（原始 {total_raw} 項）："
        + "、".join(f"{SEVERITY_LABEL[s]} {counts[s]}" for s in SEVERITY_ORDER)
    )
    lines.append("")
    lines.append("| 面向 | 原始項數 | 狀態 |")
    lines.append("| --- | ---: | --- |")
    for dim in DIMENSIONS:
        status = f"⚠️ {errors[dim]}" if dim in errors else "✅"
        lines.append(f"| {DIMENSION_LABEL[dim]} | {raw_counts.get(dim, 0)} | {status} |")
    lines.append("")
    lines.append("| # | 嚴重度 | 位置 | 問題 | 抓到的面向 |")
    lines.append("| ---: | --- | --- | --- | --- |")
    for idx, f in enumerate(merged, 1):
        srcs = "、".join(DIMENSION_LABEL[s] for s in f["sources"])
        title = str(f.get("title", "")).replace("|", "\\|")
        lines.append(f"| {idx} | {SEVERITY_LABEL[f['severity']]} | `{f.get('file', '?')}:{f['line']}` | {title} | {srcs} |")
    lines.append("")
    lines.append("## 詳細說明")
    for idx, f in enumerate(merged, 1):
        lines += [
            "",
            f"### {idx}. [{SEVERITY_LABEL[f['severity']]}] {f.get('title', '')}",
            f"- 位置：`{f.get('file', '?')}:{f['line']}`　標籤：`{f.get('tag', 'other')}`",
            f"- 說明：{f.get('detail', '')}",
            f"- 建議：{f.get('suggestion', '')}",
        ]
    lines += ["", "---", "_由 3 個平行 `claude -p` 審查 job 產生，經 aggregate.py 去重排序。_", ""]
    return "\n".join(lines)


def main() -> int:
    if len(sys.argv) != 3:
        print("用法：python aggregate.py <raw_dir> <output_md>", file=sys.stderr)
        return 2
    raw_dir, output_md = Path(sys.argv[1]), Path(sys.argv[2])
    all_findings, raw_counts, errors = [], {}, {}
    for dim in DIMENSIONS:
        findings, err = load_findings(raw_dir, dim)
        raw_counts[dim] = len(findings)
        if err:
            errors[dim] = err
            print(f"警告：{dim} {err}", file=sys.stderr)
        all_findings += findings
    merged = merge_findings(all_findings)
    output_md.write_text(render_report(merged, raw_counts, errors), encoding="utf-8")
    print(f"已寫入 {output_md}：去重後 {len(merged)} 項（原始 {len(all_findings)} 項）")
    # 三個面向都失敗才視為失敗
    return 1 if len(errors) == len(DIMENSIONS) else 0


def _self_test() -> None:
    """冒煙測試：兩個面向抓到同一行同 tag 應合併，且保留較高嚴重度。"""
    a = {"file": "x.py", "tag": "sql-injection", "line": 10, "severity": "medium", "sources": ["conventions"]}
    b = {"file": "x.py", "tag": "sql-injection", "line": 11, "severity": "critical", "sources": ["security"]}
    c = {"file": "x.py", "tag": "naming", "line": 10, "severity": "low", "sources": ["conventions"]}
    merged = merge_findings([a, b, c])
    assert len(merged) == 2, merged
    assert merged[0]["severity"] == "critical" and set(merged[0]["sources"]) == {"conventions", "security"}
    assert extract_json_object('```json\n{"findings": []}\n```') == {"findings": []}
    print("self-test OK")


if __name__ == "__main__":
    if sys.argv[1:] == ["--self-test"]:
        _self_test()
        sys.exit(0)
    sys.exit(main())
