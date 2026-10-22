const test = require("node:test");
const assert = require("node:assert");
const { capitalize, slugify, truncate } = require("../src/strings");

test("capitalize 首字大寫", () => assert.strictEqual(capitalize("hello"), "Hello"));
test("capitalize 空字串", () => assert.strictEqual(capitalize(""), ""));
test("slugify 轉成網址片段", () => assert.strictEqual(slugify(" Hello World! "), "hello-world"));
test("truncate 未超過長度原樣回傳", () => assert.strictEqual(truncate("hello", 5), "hello"));
test("truncate 超過長度截斷並加上…", () => assert.strictEqual(truncate("hello world", 6), "hello…"));
test("truncate maxLength 為 1 只剩…", () => assert.strictEqual(truncate("hello", 1), "…"));
test("truncate maxLength 小於 1 拋錯", () => assert.throws(() => truncate("hello", 0), RangeError));
