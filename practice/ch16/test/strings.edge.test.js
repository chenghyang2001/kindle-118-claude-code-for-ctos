// strings.js 邊界測試：依函式實際行為斷言
const test = require("node:test");
const assert = require("node:assert");
const { capitalize, slugify } = require("../src/strings");

// capitalize
test("capitalize null 回傳空字串", () => assert.strictEqual(capitalize(null), ""));
test("capitalize undefined 回傳空字串", () => assert.strictEqual(capitalize(undefined), ""));
test("capitalize 全符號字串原樣回傳", () =>
  assert.strictEqual(capitalize("!@#$%^&*()"), "!@#$%^&*()"));
test("capitalize 中文字串原樣回傳", () => assert.strictEqual(capitalize("你好世界"), "你好世界"));

// slugify
test("slugify null 回傳空字串", () => assert.strictEqual(slugify(null), ""));
test("slugify undefined 回傳空字串", () => assert.strictEqual(slugify(undefined), ""));
test("slugify 全符號字串回傳空字串", () => assert.strictEqual(slugify("!@#$%^&*()"), ""));
// 注意：非 ASCII 字元全被移除，中文輸入會得到空字串（疑似 bug）
test("slugify 中文字串回傳空字串（實際行為）", () => assert.strictEqual(slugify("你好世界"), ""));
