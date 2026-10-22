'use strict';
// Customer 資料模型：欄位定義與驗證
/**
 * @typedef {Object} Customer
 * @property {string} id
 * @property {string} name
 * @property {string} [company]
 * @property {string} [tier]
 */

const FIELDS = ["name","company","tier"];

/** @returns {string[]} 錯誤訊息，空陣列代表合法 */
function validateCustomer(input) {
  const errors = [];
  if (input === null || typeof input !== 'object') return ['輸入必須是物件'];
  if (input.name === undefined) errors.push('name 為必填');
  if (input.name !== undefined && typeof input.name !== 'string') errors.push('name 必須是 string');
  if (input.company !== undefined && typeof input.company !== 'string') errors.push('company 必須是 string');
  if (input.tier !== undefined && typeof input.tier !== 'string') errors.push('tier 必須是 string');
  return errors;
}

/** @returns {Customer} */
function buildCustomer(id, input) {
  return {
    id,
    name: input.name,
    company: input.company,
    tier: input.tier,
  };
}

module.exports = { FIELDS, validateCustomer, buildCustomer };
