const test = require("node:test");
const assert = require("node:assert");
const { add, divide, multiply, power } = require("../src/calc");

test("add 兩數相加", () => assert.strictEqual(add(2, 3), 5));
test("divide 正常除法", () => assert.strictEqual(divide(6, 3), 2));
test("divide 除以 0 拋錯", () => assert.throws(() => divide(1, 0)));
test("multiply 兩數相乘", () => assert.strictEqual(multiply(4, 5), 20));
test("multiply 乘以 0", () => assert.strictEqual(multiply(7, 0), 0));
test("power 正常次方", () => assert.strictEqual(power(2, 10), 1024));
test("power 指數為 0", () => assert.strictEqual(power(5, 0), 1));
test("power 負指數拋錯", () => assert.throws(() => power(2, -1)));
test("power 非整數指數拋錯", () => assert.throws(() => power(2, 1.5)));
