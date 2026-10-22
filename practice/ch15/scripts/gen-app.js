#!/usr/bin/env node
// 產生中型假專案 app/：8 個領域 × (model / service / route / test) + 共用檔
// 目的：讓 A/B 實驗有足夠多「看起來都相關」的檔案，才看得出前置載入省下多少探索
"use strict";
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.join(__dirname, "..", "app");

// 每個領域的欄位：[名稱, 型別, 是否必填]
const DOMAINS = {
  user: [
    ["name", "string", true],
    ["email", "string", true],
    ["age", "number", false],
  ],
  customer: [
    ["name", "string", true],
    ["company", "string", false],
    ["tier", "string", false],
  ],
  product: [
    ["title", "string", true],
    ["price", "number", true],
    ["stock", "number", false],
  ],
  order: [
    ["customerId", "string", true],
    ["productId", "string", true],
    ["quantity", "number", true],
  ],
  invoice: [
    ["orderId", "string", true],
    ["amount", "number", true],
    ["paid", "boolean", false],
  ],
  shipment: [
    ["orderId", "string", true],
    ["carrier", "string", true],
    ["tracking", "string", false],
  ],
  review: [
    ["productId", "string", true],
    ["rating", "number", true],
    ["comment", "string", false],
  ],
  coupon: [
    ["code", "string", true],
    ["discount", "number", true],
    ["active", "boolean", false],
  ],
};

const cap = (s) => s[0].toUpperCase() + s.slice(1);

function write(rel, content) {
  const full = path.join(ROOT, rel);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, content, "utf8");
}

function sampleValue(type, i) {
  if (type === "number") return String(i + 1);
  if (type === "boolean") return "true";
  return `'sample-${i}'`;
}

function modelFile(name, fields) {
  const C = cap(name);
  const typedef = fields
    .map(([f, t, r]) => ` * @property {${t}} ${r ? f : `[${f}]`}`)
    .join("\n");
  const checks = fields
    .map(([f, t, r]) => {
      const req = r
        ? `  if (input.${f} === undefined) errors.push('${f} 為必填');\n`
        : "";
      return `${req}  if (input.${f} !== undefined && typeof input.${f} !== '${t}') errors.push('${f} 必須是 ${t}');`;
    })
    .join("\n");
  const pick = fields.map(([f]) => `    ${f}: input.${f},`).join("\n");
  return `'use strict';
// ${C} 資料模型：欄位定義與驗證
/**
 * @typedef {Object} ${C}
 * @property {string} id
${typedef}
 */

const FIELDS = ${JSON.stringify(fields.map(([f]) => f))};

/** @returns {string[]} 錯誤訊息，空陣列代表合法 */
function validate${C}(input) {
  const errors = [];
  if (input === null || typeof input !== 'object') return ['輸入必須是物件'];
${checks}
  return errors;
}

/** @returns {${C}} */
function build${C}(id, input) {
  return {
    id,
${pick}
  };
}

module.exports = { FIELDS, validate${C}, build${C} };
`;
}

function serviceFile(name) {
  const C = cap(name);
  return `'use strict';
// ${C} 服務層：記憶體儲存的 CRUD
const { validate${C}, build${C} } = require('../models/${name}');
const { createStore } = require('../lib/store');
const { ValidationError, NotFoundError } = require('../lib/errors');

function create${C}Service(store = createStore('${name}')) {
  return {
    create(input) {
      const errors = validate${C}(input);
      if (errors.length) throw new ValidationError(errors);
      return store.insert((id) => build${C}(id, input));
    },
    get(id) {
      const item = store.find(id);
      if (!item) throw new NotFoundError('${name}', id);
      return item;
    },
    list() {
      return store.all();
    },
    update(id, patch) {
      const current = this.get(id);
      const merged = { ...current, ...patch };
      const errors = validate${C}(merged);
      if (errors.length) throw new ValidationError(errors);
      return store.replace(id, build${C}(id, merged));
    },
    remove(id) {
      this.get(id);
      store.delete(id);
      return true;
    },
  };
}

module.exports = { create${C}Service };
`;
}

function routeFile(name) {
  const C = cap(name);
  return `'use strict';
// ${C} 路由：把 {method, params, body} 轉成服務呼叫並回傳 {status, body}
const { create${C}Service } = require('../services/${name}');
const { toResponse } = require('../lib/http');

function ${name}Routes(service = create${C}Service()) {
  return {
    'GET /${name}s': () => toResponse(() => ({ status: 200, body: service.list() })),
    'GET /${name}s/:id': (req) => toResponse(() => ({ status: 200, body: service.get(req.params.id) })),
    'POST /${name}s': (req) => toResponse(() => ({ status: 201, body: service.create(req.body) })),
    'PUT /${name}s/:id': (req) => toResponse(() => ({ status: 200, body: service.update(req.params.id, req.body) })),
    'DELETE /${name}s/:id': (req) => toResponse(() => { service.remove(req.params.id); return { status: 204, body: null }; }),
  };
}

module.exports = { ${name}Routes };
`;
}

function testFile(name, fields) {
  const C = cap(name);
  const valid = fields
    .map(([f, t], i) => `${f}: ${sampleValue(t, i)}`)
    .join(", ");
  const firstRequired = fields.find(([, , r]) => r)[0];
  return `'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { validate${C} } = require('../src/models/${name}');
const { create${C}Service } = require('../src/services/${name}');
const { ${name}Routes } = require('../src/routes/${name}');

const VALID = { ${valid} };

test('${name} model：合法輸入沒有錯誤', () => {
  assert.deepEqual(validate${C}(VALID), []);
});

test('${name} model：缺必填欄位 ${firstRequired}', () => {
  const { ${firstRequired}: _omit, ...rest } = VALID;
  assert.ok(validate${C}(rest).length > 0);
});

test('${name} service：create/get/update/remove', () => {
  const svc = create${C}Service();
  const created = svc.create(VALID);
  assert.equal(svc.get(created.id).id, created.id);
  assert.equal(svc.list().length, 1);
  svc.update(created.id, {});
  assert.equal(svc.remove(created.id), true);
  assert.throws(() => svc.get(created.id), /not found/);
});

test('${name} route：POST 201、錯誤輸入 400、找不到 404', () => {
  const routes = ${name}Routes();
  assert.equal(routes['POST /${name}s']({ body: VALID }).status, 201);
  assert.equal(routes['POST /${name}s']({ body: {} }).status, 400);
  assert.equal(routes['GET /${name}s/:id']({ params: { id: 'nope' } }).status, 404);
});
`;
}

const LIB = {
  "src/lib/store.js": `'use strict';
// 記憶體儲存：每個 service 一份，id 用遞增流水號
function createStore(prefix) {
  const rows = new Map();
  let seq = 0;
  return {
    insert(factory) { const id = \`\${prefix}-\${++seq}\`; const row = factory(id); rows.set(id, row); return row; },
    find(id) { return rows.get(id) ?? null; },
    all() { return [...rows.values()]; },
    replace(id, row) { rows.set(id, row); return row; },
    delete(id) { rows.delete(id); },
  };
}
module.exports = { createStore };
`,
  "src/lib/errors.js": `'use strict';
class ValidationError extends Error {
  constructor(errors) { super(errors.join('; ')); this.errors = errors; this.status = 400; }
}
class NotFoundError extends Error {
  constructor(kind, id) { super(\`\${kind} \${id} not found\`); this.status = 404; }
}
module.exports = { ValidationError, NotFoundError };
`,
  "src/lib/http.js": `'use strict';
// 統一把例外轉成 HTTP 狀態碼，未知錯誤一律 500 不洩漏細節
function toResponse(fn) {
  try { return fn(); }
  catch (err) {
    if (err.status) return { status: err.status, body: { error: err.message } };
    return { status: 500, body: { error: 'Internal server error' } };
  }
}
module.exports = { toResponse };
`,
};

function main() {
  // 只清內容不刪目錄本身：Windows 上目錄若被其他程序當 cwd 會 EPERM
  fs.mkdirSync(ROOT, { recursive: true });
  for (const entry of fs.readdirSync(ROOT)) fs.rmSync(path.join(ROOT, entry), { recursive: true, force: true });
  for (const [rel, content] of Object.entries(LIB)) write(rel, content);
  for (const [name, fields] of Object.entries(DOMAINS)) {
    write(`src/models/${name}.js`, modelFile(name, fields));
    write(`src/services/${name}.js`, serviceFile(name));
    write(`src/routes/${name}.js`, routeFile(name));
    write(`test/${name}.test.js`, testFile(name, fields));
  }
  const names = Object.keys(DOMAINS);
  write(
    "src/router.js",
    `'use strict';
// 匯總所有路由
${names.map((n) => `const { ${n}Routes } = require('./routes/${n}');`).join("\n")}

function buildRouter() {
  return { ${names.map((n) => `...${n}Routes()`).join(", ")} };
}
module.exports = { buildRouter };
`,
  );
  write(
    "test/router.test.js",
    `'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { buildRouter } = require('../src/router');

test('router 包含所有領域的 5 條路由', () => {
  assert.equal(Object.keys(buildRouter()).length, ${names.length * 5});
});
`,
  );
  write(
    "package.json",
    JSON.stringify(
      {
        name: "k118-ch15-fake-app",
        version: "1.0.0",
        private: true,
        scripts: { test: "node --test \"test/*.test.js\"" },
      },
      null,
      2,
    ) + "\n",
  );
  write(
    "README.md",
    `# 假專案（第 15 章 A/B 實驗用）\n\n由 \`scripts/gen-app.js\` 產生，請勿手改。\`npm test\` 執行測試。\n`,
  );
  const count = fs
    .readdirSync(ROOT, { recursive: true })
    .filter((p) => fs.statSync(path.join(ROOT, p)).isFile()).length;
  console.log(`已產生 ${count} 個檔案於 ${ROOT}`);
}

try {
  main();
} catch (err) {
  console.error(`產生失敗：${err.message}`);
  process.exit(1);
}
