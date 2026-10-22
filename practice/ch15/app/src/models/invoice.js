'use strict';
// Invoice 資料模型：欄位定義與驗證
/**
 * @typedef {Object} Invoice
 * @property {string} id
 * @property {string} orderId
 * @property {number} amount
 * @property {boolean} [paid]
 */

const FIELDS = ["orderId","amount","paid"];

/** @returns {string[]} 錯誤訊息，空陣列代表合法 */
function validateInvoice(input) {
  const errors = [];
  if (input === null || typeof input !== 'object') return ['輸入必須是物件'];
  if (input.orderId === undefined) errors.push('orderId 為必填');
  if (input.orderId !== undefined && typeof input.orderId !== 'string') errors.push('orderId 必須是 string');
  if (input.amount === undefined) errors.push('amount 為必填');
  if (input.amount !== undefined && typeof input.amount !== 'number') errors.push('amount 必須是 number');
  if (input.paid !== undefined && typeof input.paid !== 'boolean') errors.push('paid 必須是 boolean');
  return errors;
}

/** @returns {Invoice} */
function buildInvoice(id, input) {
  return {
    id,
    orderId: input.orderId,
    amount: input.amount,
    paid: input.paid,
  };
}

module.exports = { FIELDS, validateInvoice, buildInvoice };
