"""驗證部署範本：templates/ 底下 JSON 合法、.env.example 沒有像真金鑰的值。只用標準庫。"""
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent

# 真金鑰的樣式：Anthropic 金鑰固定以 sk-ant- 開頭
SECRET_PATTERNS = [
    re.compile(r"sk-ant-[A-Za-z0-9_\-]{8,}"),
    re.compile(r"AKIA[0-9A-Z]{16}"),  # AWS Access Key（順便擋）
]
# 範本允許的假值：空字串、<...> 佔位符
PLACEHOLDER = re.compile(r"^(<[^>]*>|)$")


def check_json_files(template_dir: Path) -> list[str]:
    """回傳 JSON 錯誤清單；目錄不存在也算錯。"""
    errors: list[str] = []
    if not template_dir.is_dir():
        return [f"找不到目錄：{template_dir}"]
    json_files = sorted(template_dir.glob("*.json"))
    if not json_files:
        errors.append(f"{template_dir} 沒有任何 JSON 範本")
    for path in json_files:
        try:
            json.loads(path.read_text(encoding="utf-8"))
        except json.JSONDecodeError as exc:
            errors.append(f"{path.name}：JSON 不合法（第 {exc.lineno} 行）{exc.msg}")
        except (OSError, UnicodeDecodeError) as exc:
            errors.append(f"{path.name}：無法讀取 {exc}")
    return errors


def check_env_text(text: str, name: str = ".env.example") -> list[str]:
    """檢查 env 範本內容：像真金鑰的值、或 API_KEY 類變數被填了非佔位值。"""
    errors: list[str] = []
    for lineno, line in enumerate(text.splitlines(), start=1):
        for pattern in SECRET_PATTERNS:
            if pattern.search(line):
                errors.append(f"{name} 第 {lineno} 行：疑似真金鑰（{pattern.pattern}）")
        stripped = line.strip()
        if not stripped or stripped.startswith("#") or "=" not in stripped:
            continue
        key, value = stripped.split("=", 1)
        value = value.strip().strip('"').strip("'")
        is_secret_var = re.search(r"(KEY|TOKEN|SECRET|PASSWORD)$", key.strip()) is not None
        if is_secret_var and key.strip() != "ANTHROPIC_KEY_NAME" and not PLACEHOLDER.match(value):
            errors.append(f"{name} 第 {lineno} 行：{key.strip()} 應為空或 <佔位符>")
    return errors


def self_test() -> None:
    """冒煙測試：正常、邊界、錯誤三種案例。"""
    assert check_env_text("ANTHROPIC_API_KEY=<填入>\n") == []
    assert check_env_text("") == []
    assert check_env_text("ANTHROPIC_API_KEY=sk-ant-api03-abcdefghijk\n")
    assert check_env_text("GITHUB_TOKEN=ghp_realvalue\n")


def main() -> int:
    self_test()
    errors = check_json_files(ROOT / "templates")
    # 本機權限禁止寫 .env* 檔，範本改名 env.example；兩種名稱都檢查
    env_paths = [p for p in (ROOT / ".env.example", ROOT / "env.example") if p.is_file()]
    if not env_paths:
        errors.append("找不到 .env.example 或 env.example")
    for env_path in env_paths:
        errors += check_env_text(env_path.read_text(encoding="utf-8"), env_path.name)
    if errors:
        for err in errors:
            print(f"[FAIL] {err}", file=sys.stderr)
        return 1
    names = "、".join(p.name for p in env_paths)
    print(f"[PASS] 範本 JSON 合法，{names} 沒有疑似真金鑰")
    return 0


if __name__ == "__main__":
    sys.exit(main())
