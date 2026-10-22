#!/bin/bash
set -euo pipefail
# 在兩個獨立 worktree 各跑一次 claude -p（A=前置載入、B=只描述需求），輸出 stream-json 到 runs/
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
# 第 1 個參數是輪次標籤（r1、r2…）；兩個變體都從同一個 BASE commit 長出，避免中途 commit 造成起點不同
ROUND="${1:-r1}"
BASE="$(git rev-parse HEAD)"

run_variant() {
  local tag="$1" branch="$2" prompt_file="$3"
  # Git for Windows 收到 /c/... 會誤轉成 C:/c/...，所以先轉成 C:/ 形式
  local wt
  wt="$(cygpath -m "$ROOT/.worktrees/$tag" 2>/dev/null || echo "$ROOT/.worktrees/$tag")"
  if [ -d "$wt" ]; then git worktree remove --force "$wt"; fi
  git branch -D "$branch" 2>/dev/null || true
  git worktree add -q -b "$branch" "$wt" "$BASE" || { echo "建立 worktree 失敗：$wt"; exit 1; }

  echo "== 執行 $tag（$branch）=="
  local start end
  start=$(date +%s)
  # 清掉 CLAUDE* 環境變數，避免子 session 繼承父 session 狀態；
  # --setting-sources project,local 排除全域 hook（全域 Stop hook 會讓子 session 自己 commit）
  # prompt 走 stdin，避免與其他多值參數互吃
  ( cd "$wt" && env $(env | grep -o '^CLAUDE[A-Z_]*' | sed 's/^/-u /') \
      claude -p --output-format stream-json --verbose \
      --setting-sources project,local \
      --dangerously-skip-permissions \
      < "$ROOT/$prompt_file" > "$ROOT/runs/$tag.jsonl" 2> "$ROOT/runs/$tag.stderr.txt" ) \
    || echo "警告：$tag 的 claude -p 回傳非 0，請看 runs/$tag.stderr.txt"
  end=$(date +%s)
  echo "$((end - start))" > "runs/$tag.wallclock.txt"

  # 收集結果：diff 與測試結果
  ( cd "$wt" && git add -A && git diff --cached --stat HEAD && git diff --cached HEAD ) > "runs/$tag.diff" || true
  ( cd "$wt/app" && npm test 2>&1 | tail -9 ) > "runs/$tag.test.txt" || true
}

run_variant "a-$ROUND" "exp/a-preload-$ROUND" prompts/a-preload.md
run_variant "b-$ROUND" "exp/b-vague-$ROUND"   prompts/b-vague.md
echo "完成，接著執行：node scripts/stats.js"
