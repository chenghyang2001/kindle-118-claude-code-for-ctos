'use strict';
// Order 資料模型：欄位定義與驗證
/**
 * @typedef {Object} Order
 * @property {string} id
 * @property {string} customerId
 * @property {string} productId
 * @property {number} quantity
 */

const FIELDS = ["customerId","productId","quantity"];

/** @returns {string[]} 錯誤訊息，空陣列代表合法 */
function validateOrder(input) {
  const errors = [];
  if (input === null || typeof input !== 'object') return ['輸入必須是物件'];
  if (input.customerId === undefined) errors.push('customerId 為必填');
  if (input.customerId !== undefined && typeof input.customerId !== 'string') errors.push('customerId 必須是 string');
  if (input.productId === undefined) errors.push('productId 為必填');
  if (input.productId !== undefined && typeof input.productId !== 'string') errors.push('productId 必須是 string');
  if (input.quantity === undefined) errors.push('quantity 為必填');
  if (input.quantity !== undefined && typeof input.quantity !== 'number') errors.push('quantity 必須是 number');
  return errors;
}

/** @returns {Order} */
function buildOrder(id, input) {
  return {
    id,
    customerId: input.customerId,
    productId: input.productId,
    quantity: input.quantity,
  };
}

module.exports = { FIELDS, validateOrder, buildOrder };
