#!/bin/bash
# 本機重跑「三面向平行審查 → 彙整報告」流程（第 20 章演練）
#
# 用法：
#   ./run_local_review.sh                # 審查 review.diff
#   ./run_local_review.sh my.diff        # 審查指定 diff
#   ./run_local_review.sh --from-git     # 先用 git diff HEAD 重新產生 review.diff 再審查
#   ./run_local_review.sh --dry-run      # 只印出會執行的指令，不呼叫 claude
#
# 可調環境變數：REVIEW_MODEL（預設 sonnet）、REVIEW_MAX_TURNS（預設 8）
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROMPT_DIR="$ROOT_DIR/.github/claude-review/prompts"
AGGREGATOR="$ROOT_DIR/.github/claude-review/aggregate.py"
OUT_DIR="$ROOT_DIR/review-out"
REPORT="$ROOT_DIR/REVIEW-REPORT.md"
DIMENSIONS=(correctness security conventions)
MODEL="${REVIEW_MODEL:-sonnet}"
MAX_TURNS="${REVIEW_MAX_TURNS:-8}"
DRY_RUN=0
DIFF_FILE="$ROOT_DIR/review.diff"

for arg in "$@"; do
  case "$arg" in
    --dry-run) DRY_RUN=1 ;;
    --from-git)
      git -C "$ROOT_DIR" diff HEAD > "$DIFF_FILE" || { echo "錯誤：git diff 失敗" >&2; exit 1; }
      ;;
    -h|--help) sed -n '2,11p' "$0"; exit 0 ;;
    *) DIFF_FILE="$arg" ;;
  esac
done

[ -s "$DIFF_FILE" ] || { echo "錯誤：diff 檔不存在或是空的：$DIFF_FILE" >&2; exit 1; }
command -v claude >/dev/null || { echo "錯誤：找不到 claude CLI" >&2; exit 1; }

# 子 session 不可繼承父 session 的 CLAUDE* 變數（否則會被當成巢狀 session）；
# 也不用 API Key，走訂閱額度
while IFS= read -r var_name; do unset "$var_name"; done < <(env | grep -o '^CLAUDE[A-Za-z0-9_]*' || true)
unset ANTHROPIC_API_KEY

mkdir -p "$OUT_DIR"
cd "$ROOT_DIR"

run_one_review() {
  local dimension="$1"
  local raw_out="$OUT_DIR/$dimension.raw.json"
  # prompt 走 stdin：--allowedTools / --tools 是可變長參數，會把後面的位置參數吃掉
  {
    cat "$PROMPT_DIR/$dimension.md" "$PROMPT_DIR/_output-format.md"
    printf '\n## 待審查的 diff\n\n```diff\n'
    cat "$DIFF_FILE"
    printf '\n```\n'
  } | claude -p \
      --setting-sources project,local \
      --model "$MODEL" \
      --max-turns "$MAX_TURNS" \
      --output-format json \
      --no-session-persistence \
      --tools "Read,Grep,Glob" \
      --allowedTools "Read,Grep,Glob" \
      > "$raw_out" 2> "$OUT_DIR/$dimension.log"
}

if [ "$DRY_RUN" -eq 1 ]; then
  for d in "${DIMENSIONS[@]}"; do
    echo "[dry-run] cat prompts/$d.md + diff | claude -p --setting-sources project,local --model $MODEL --tools Read,Grep,Glob --allowedTools Read,Grep,Glob > review-out/$d.raw.json &"
  done
  echo "[dry-run] python aggregate.py review-out REVIEW-REPORT.md"
  exit 0
fi

echo "審查 $(basename "$DIFF_FILE")（$(wc -l < "$DIFF_FILE") 行），模型 $MODEL，三個面向平行執行中..."
start_ts=$(date +%s)
declare -A pids
for d in "${DIMENSIONS[@]}"; do
  run_one_review "$d" &
  pids[$d]=$!
done

fail_count=0
for d in "${DIMENSIONS[@]}"; do
  if wait "${pids[$d]}"; then
    echo "  ✅ $d 完成"
  else
    echo "  ❌ $d 失敗（看 review-out/$d.log）" >&2
    fail_count=$((fail_count + 1))
  fi
done
echo "平行審查耗時 $(( $(date +%s) - start_ts )) 秒"

[ "$fail_count" -lt "${#DIMENSIONS[@]}" ] || { echo "錯誤：三個審查全部失敗" >&2; exit 1; }

# 給 Windows 版 python 相對路徑：環境有 MSYS_NO_PATHCONV=1 時 /c/Users/... 不會被轉換，會變成 C:\c\Users\...
PYTHONUTF8=1 python "${AGGREGATOR#"$ROOT_DIR"/}" "${OUT_DIR#"$ROOT_DIR"/}" "${REPORT#"$ROOT_DIR"/}"
