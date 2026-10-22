#!/bin/bash
set -euo pipefail
# 用 claude -p 套用 test-generation/unit-tests-from-function.md 提示詞，對 pricing.py 產生測試
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
EX="$ROOT/prompt-library/examples/unit-tests-from-function"
TPL="$ROOT/prompt-library/test-generation/unit-tests-from-function.md"

# 取出 ```prompt 區塊並替換變數
PROMPT="$(sed -n '/^```prompt/,/^```$/p' "$TPL" | sed '1d;$d' \
  | sed -e 's#{{FILE}}#pricing.py#g' -e 's#{{FUNCTION}}#apply_discount#g' \
        -e 's#{{FRAMEWORK}}#pytest#g' -e 's#{{TEST_FILE}}#test_pricing.py#g')"
if grep -q '{{' <<<"$PROMPT"; then echo "錯誤：仍有未替換變數" >&2; exit 1; fi
printf '%s\n' "$PROMPT" > "$EX/prompt-used.txt"

# 清掉 CLAUDE* 環境變數，避免子 session 繼承父 session 狀態
for v in $(env | grep -o '^CLAUDE[A-Za-z0-9_]*' || true); do unset "$v"; done

cd "$EX"
claude -p "$PROMPT" \
  --setting-sources project,local \
  --allowedTools "Read,Write,Edit,Glob,Grep" \
  --output-format text < /dev/null > claude-output.md || { echo "錯誤：claude -p 失敗" >&2; exit 1; }

"$ROOT/.venv/Scripts/python" -m pytest -q test_pricing.py 2>&1 | tee pytest-result.txt
