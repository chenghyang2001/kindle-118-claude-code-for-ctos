#!/usr/bin/env node
// 解析 runs/<a|b>-<round>.jsonl（claude -p stream-json），統計工具呼叫、讀檔數、回合、token、秒數
// 子 session 常用 Bash 的 cat/sed/grep 讀檔而非 Read 工具，所以讀檔數同時從 Bash 指令解析（啟發式）
"use strict";
const fs = require("node:fs");
const path = require("node:path");

const RUNS = path.join(__dirname, "..", "runs");
const APP = path.join(__dirname, "..", "app");
// 這些指令後面接的檔名視為「讀取」
const READ_CMDS = new Set([
  "cat",
  "head",
  "tail",
  "sed",
  "grep",
  "wc",
  "less",
  "type",
  "nl",
]);
const FILE_RE = /^[\w./*-]+\.(js|json|md|txt|sh)$/;

function parseLines(file) {
  const events = [];
  for (const [i, line] of fs
    .readFileSync(file, "utf8")
    .split(/\r?\n/)
    .entries()) {
    if (!line.trim()) continue;
    try {
      events.push(JSON.parse(line));
    } catch {
      console.error(`略過無法解析的第 ${i + 1} 行：${file}`);
    }
  }
  return events;
}

// 統一成相對 repo 根目錄的路徑（app/src/...），A/B 才能比較
function normalize(p, cwd) {
  let norm = String(p)
    .replace(/\\/g, "/")
    .replace(/^["']|["']$/g, "");
  if (cwd && !/^[A-Za-z]:\//.test(norm) && !norm.startsWith("/"))
    norm = `${cwd}/${norm}`;
  // worktree 根目錄本身（cd .../.worktrees/b）歸一成 "."
  const wt = norm.match(/\.worktrees\/[^/]+(?:\/(.*))?$/);
  if (wt) return wt[1] ? path.posix.normalize(wt[1]) : ".";
  if (/^[A-Za-z]:\//.test(norm) || norm.startsWith("/"))
    return norm.split("/").slice(-3).join("/");
  return path.posix.normalize(norm);
}

// 萬用字元（src/lib/*.js）對照實際 app/ 展開，算出真的讀到幾個檔
function expandGlob(rel) {
  if (!rel.includes("*")) return [rel];
  const dir = path.posix.dirname(rel);
  const re = new RegExp(
    "^" +
      path.posix.basename(rel).replace(/\./g, "\\.").replace(/\*/g, ".*") +
      "$",
  );
  const local = path.join(APP, "..", dir);
  if (!fs.existsSync(local)) return [rel];
  return fs
    .readdirSync(local)
    .filter((f) => re.test(f))
    .map((f) => `${dir}/${f}`);
}

function filesReadByBash(command) {
  const found = [];
  let cwd = "";
  // heredoc 與 node -e / python 腳本內容是「寫檔」程式，不算讀取，先切掉
  const head = command.split(/<<|node -e|python/)[0];
  for (const seg of head.split(/&&|;|\|\||\|/)) {
    const words = seg.trim().split(/\s+/).filter(Boolean);
    if (!words.length) continue;
    if (words[0] === "cd" && words[1]) {
      const target = normalize(words.slice(1).join(" "), "");
      cwd = target === "." ? "" : target;
      continue;
    }
    if (!READ_CMDS.has(words[0])) continue;
    for (const w of words.slice(1)) {
      const clean = w.replace(/^["']|["']$/g, "");
      if (FILE_RE.test(clean)) found.push(...expandGlob(normalize(clean, cwd)));
    }
  }
  return found;
}

function collectToolUse(events) {
  const stats = {
    toolCalls: 0,
    toolCounts: {},
    readFiles: new Set(),
    editCalls: 0,
    errors: 0,
  };
  for (const ev of events) {
    for (const block of ev.message?.content ?? []) {
      if (ev.type === "user" && block.type === "tool_result" && block.is_error)
        stats.errors++;
      if (ev.type !== "assistant" || block.type !== "tool_use") continue;
      stats.toolCalls++;
      stats.toolCounts[block.name] = (stats.toolCounts[block.name] ?? 0) + 1;
      const input = block.input ?? {};
      if (block.name === "Read" && input.file_path)
        stats.readFiles.add(normalize(input.file_path, ""));
      if (["Edit", "Write", "MultiEdit"].includes(block.name))
        stats.editCalls++;
      if (block.name === "Bash") {
        filesReadByBash(input.command ?? "").forEach((f) =>
          stats.readFiles.add(f),
        );
        if (
          /writeFileSync|open\([^)]*['"]w['"]|\.write\(|>\s*\S+\.js/.test(
            input.command ?? "",
          )
        )
          stats.editCalls++;
      }
    }
  }
  return stats;
}

function summarize(tag) {
  const events = parseLines(path.join(RUNS, `${tag}.jsonl`));
  const used = collectToolUse(events);
  const result = events.findLast((e) => e.type === "result") ?? {};
  const u = result.usage ?? {};
  const readText = (suffix) => {
    const f = path.join(RUNS, `${tag}.${suffix}`);
    return fs.existsSync(f) ? fs.readFileSync(f, "utf8") : "";
  };
  const testText = readText("test.txt");
  const diffStat = readText("diff").match(/(\d+) files? changed/)?.[1] ?? "?";
  return {
    tag,
    ...used,
    readFiles: [...used.readFiles].sort(),
    changedFiles: diffStat,
    turns: result.num_turns ?? null,
    durationSec:
      result.duration_ms != null
        ? Number((result.duration_ms / 1000).toFixed(1))
        : null,
    wallSec: Number(readText("wallclock.txt").trim()) || null,
    inputTokens: u.input_tokens ?? 0,
    cacheRead: u.cache_read_input_tokens ?? 0,
    cacheCreate: u.cache_creation_input_tokens ?? 0,
    outputTokens: u.output_tokens ?? 0,
    costUsd: result.total_cost_usd ?? null,
    tests: `${testText.match(/ℹ pass (\d+)/)?.[1] ?? "?"} pass / ${testText.match(/ℹ fail (\d+)/)?.[1] ?? "?"} fail`,
  };
}

const total = (r) =>
  r.inputTokens + r.cacheRead + r.cacheCreate + r.outputTokens;

function table(rows) {
  const label = (r) =>
    `${r.tag.startsWith("a") ? "A 前置載入" : "B 只描述需求"}（${r.tag.split("-")[1]}）`;
  const lines = [
    ["指標", ...rows.map(label)],
    ["工具呼叫總數", ...rows.map((r) => r.toolCalls)],
    [
      "工具分佈",
      ...rows.map((r) =>
        Object.entries(r.toolCounts)
          .map(([k, v]) => `${k}×${v}`)
          .join(", "),
      ),
    ],
    ["失敗的工具呼叫", ...rows.map((r) => r.errors)],
    ["讀取的不同檔案數", ...rows.map((r) => r.readFiles.length)],
    ["寫檔動作次數", ...rows.map((r) => r.editCalls)],
    ["最終改動檔案數（git diff）", ...rows.map((r) => r.changedFiles)],
    ["回合數（num_turns）", ...rows.map((r) => r.turns)],
    ["input tokens（未快取）", ...rows.map((r) => r.inputTokens)],
    ["cache read tokens", ...rows.map((r) => r.cacheRead)],
    ["cache creation tokens", ...rows.map((r) => r.cacheCreate)],
    ["output tokens", ...rows.map((r) => r.outputTokens)],
    ["token 合計", ...rows.map(total)],
    [
      "花費 total_cost_usd（API 計價參考）",
      ...rows.map((r) =>
        r.costUsd != null ? `$${r.costUsd.toFixed(4)}` : "—",
      ),
    ],
    ["秒數（duration_ms）", ...rows.map((r) => r.durationSec)],
    ["秒數（含啟動，wall clock）", ...rows.map((r) => r.wallSec)],
    ["事後 npm test", ...rows.map((r) => r.tests)],
  ];
  return lines
    .map(
      (cols, i) =>
        `| ${cols.join(" | ")} |` +
        (i === 0 ? `\n|${cols.map(() => "---").join("|")}|` : ""),
    )
    .join("\n");
}

function main() {
  const tags = fs
    .readdirSync(RUNS)
    .filter((f) => /^[ab]-r\d+\.jsonl$/.test(f))
    .map((f) => f.replace(".jsonl", ""))
    .sort(
      (x, y) =>
        x.split("-")[1].localeCompare(y.split("-")[1]) || x.localeCompare(y),
    );
  if (!tags.length)
    throw new Error(
      "runs/ 裡沒有 a-rN.jsonl / b-rN.jsonl，請先跑 scripts/run-ab.sh r1",
    );
  const rows = tags.map(summarize);
  console.log(table(rows));
  for (const r of rows)
    console.log(
      `\n${r.tag} 讀過（${r.readFiles.length}）：${r.readFiles.join(", ")}`,
    );
  fs.writeFileSync(
    path.join(RUNS, "stats.json"),
    JSON.stringify(rows, null, 2),
    "utf8",
  );
}

// 冒煙測試：node scripts/stats.js --self-test
if (process.argv.includes("--self-test")) {
  const assert = require("node:assert/strict");
  assert.deepEqual(
    filesReadByBash("cd app && cat src/models/order.js test/order.test.js"),
    ["app/src/models/order.js", "app/test/order.test.js"],
  );
  assert.deepEqual(
    filesReadByBash("node -e 'fs.readFileSync(\"src/x.js\")'"),
    [],
  );
  assert.deepEqual(filesReadByBash(""), []);
  console.log("self-test 通過");
} else {
  try {
    main();
  } catch (err) {
    console.error(`統計失敗：${err.message}`);
    process.exit(1);
  }
}
