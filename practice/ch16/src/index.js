// 對外統一匯出
const calc = require("./calc");
const strings = require("./strings");

module.exports = { ...calc, ...strings };
