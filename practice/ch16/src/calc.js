// 基本數學運算模組
function add(a, b) {
  return a + b;
}

function divide(a, b) {
  if (b === 0) throw new Error("除數不可為 0");
  return a / b;
}

function multiply(a, b) {
  return a * b;
}

function power(base, exp) {
  if (!Number.isInteger(exp) || exp < 0) throw new Error("指數必須是非負整數");
  return base ** exp;
}

module.exports = { add, divide, multiply, power };
